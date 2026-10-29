/**
 * Flutterwave checkout for Qing School SaaS plans.
 *
 * Env:
 *   FLUTTERWAVE_SECRET_KEY
 *   FLUTTERWAVE_WEBHOOK_HASH (optional — verif-hash header)
 *   FLUTTERWAVE_PLAN_STARTER | _PRO | _ENTERPRISE (optional payment_plan ids)
 *   NEXT_PUBLIC_APP_URL
 */

import { prisma } from "@/lib/db";
import { PLAN_LIMITS, type SaaSPlan } from "@/lib/integrations/subscriptions";
import { PLAN_PRICE_NGN_MONTHLY } from "@/lib/billing-catalog";

export function isFlutterwaveLive() {
  return Boolean(process.env.FLUTTERWAVE_SECRET_KEY);
}

function fwPlanId(plan: SaaSPlan): string | undefined {
  const map: Record<SaaSPlan, string | undefined> = {
    STARTER: process.env.FLUTTERWAVE_PLAN_STARTER,
    PRO: process.env.FLUTTERWAVE_PLAN_PRO,
    ENTERPRISE: process.env.FLUTTERWAVE_PLAN_ENTERPRISE,
  };
  return map[plan] || undefined;
}

async function fwFetch(path: string, init?: RequestInit) {
  const key = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!key) throw new Error("FLUTTERWAVE_SECRET_KEY not set");
  const res = await fetch(`https://api.flutterwave.com/v3${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const json = await res.json();
  if (!res.ok || json.status === "error") {
    throw new Error(json?.message || `Flutterwave ${path} failed`);
  }
  return json;
}

function appOrigin() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  ).replace(/\/$/, "");
}

export async function initializeFlutterwaveSubscription(opts: {
  schoolId: string;
  plan: SaaSPlan;
  email: string;
}) {
  const { schoolId, plan, email } = opts;
  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) throw new Error("School not found");

  const maxStudents = PLAN_LIMITS[plan];
  const amount = PLAN_PRICE_NGN_MONTHLY[plan];

  await prisma.school.update({
    where: { id: schoolId },
    data: {
      plan,
      maxStudents,
      billingEmail: email,
      subscriptionStatus: isFlutterwaveLive() ? "PENDING" : "ACTIVE_MOCK",
    },
  });

  if (!isFlutterwaveLive()) {
    return {
      mock: true as const,
      provider: "flutterwave" as const,
      message:
        "Mock mode: set FLUTTERWAVE_SECRET_KEY for live checkout. Plan limits applied.",
      schoolId,
      plan,
      maxStudents,
      amountNgn: amount,
    };
  }

  const txRef = `qs_${school.slug}_${plan}_${Date.now()}`;
  const payment_plan = fwPlanId(plan);

  const payload: Record<string, unknown> = {
    tx_ref: txRef,
    amount,
    currency: "NGN",
    redirect_url: `${appOrigin()}/platform?billing=ok&provider=flutterwave`,
    customer: {
      email,
      name: school.name.slice(0, 80),
    },
    customizations: {
      title: "Qing School",
      description: `${plan} plan · ${school.shortName}`,
    },
    meta: {
      schoolId,
      plan,
      type: "saas_subscription",
      provider: "flutterwave",
    },
  };
  if (payment_plan) payload.payment_plan = payment_plan;

  const json = await fwFetch("/payments",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

  const link = json.data?.link as string | undefined;
  if (!link) throw new Error("Flutterwave did not return a payment link");

  return {
    mock: false as const,
    provider: "flutterwave" as const,
    authorizationUrl: link,
    reference: txRef,
    plan,
    maxStudents,
    amountNgn: amount,
  };
}

export async function applyFlutterwaveSubscriptionEvent(data: {
  status?: string;
  tx_ref?: string;
  meta?: { schoolId?: string; plan?: string; type?: string };
  customer?: { email?: string };
}) {
  const meta = data.meta || {};
  if (meta.type && meta.type !== "saas_subscription") {
    return { ok: false, error: "Not a SaaS subscription event" };
  }

  let school = meta.schoolId
    ? await prisma.school.findUnique({ where: { id: meta.schoolId } })
    : null;

  if (!school && data.customer?.email) {
    school = await prisma.school.findFirst({
      where: { billingEmail: data.customer.email },
    });
  }
  if (!school) return { ok: false, error: "School not found for Flutterwave event" };

  const ok =
    (data.status || "").toLowerCase() === "successful" ||
    (data.status || "").toLowerCase() === "success";

  if (!ok) {
    await prisma.school.update({
      where: { id: school.id },
      data: {
        subscriptionStatus: "PAST_DUE",
        isActive: process.env.SUSPEND_ON_PAST_DUE === "true" ? false : school.isActive,
      },
    });
    return { ok: true, schoolId: school.id, subscriptionStatus: "PAST_DUE" };
  }

  const planName = (meta.plan || school.plan || "STARTER").toUpperCase();
  const plan = (["STARTER", "PRO", "ENTERPRISE"].includes(planName)
    ? planName
    : school.plan) as SaaSPlan;

  const renews = new Date();
  renews.setMonth(renews.getMonth() + 1);

  await prisma.school.update({
    where: { id: school.id },
    data: {
      plan,
      maxStudents: PLAN_LIMITS[plan] ?? school.maxStudents,
      subscriptionStatus: "ACTIVE",
      isActive: true,
      planRenewsAt: renews,
      billingEmail: data.customer?.email || school.billingEmail,
    },
  });

  return { ok: true, schoolId: school.id, subscriptionStatus: "ACTIVE", plan };
}
