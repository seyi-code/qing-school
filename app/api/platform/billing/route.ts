import { initializeFlutterwaveSubscription, isFlutterwaveLive } from "@/lib/integrations/flutterwave-billing";
import { PLAN_PRICE_NGN_MONTHLY } from "@/lib/billing-catalog";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import {
  initializeSchoolSubscription,
  isSubscriptionLive,
  PLAN_LIMITS,
  type SaaSPlan,
} from "@/lib/integrations/subscriptions";
import { getTrialDays, trialEndsAt } from "@/lib/trial";

const SetPlanSchema = z.object({
  action: z.literal("set_plan").optional(),
  schoolId: z.string(),
  plan: z.enum(["STARTER", "PRO", "ENTERPRISE"]),
  maxStudents: z.number().int().min(1).max(100000).optional(),
});

const SubscribeSchema = z.object({
  action: z.enum(["subscribe", "subscribe_flutterwave"]),
  schoolId: z.string(),
  plan: z.enum(["STARTER", "PRO", "ENTERPRISE"]),
  email: z.string().email(),
});

export async function GET() {
  const session = await getSession();
  if (!session || !["PLATFORM_ADMIN", "ADMIN", "IT"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const schools = await prisma.school.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
      maxStudents: true,
      isActive: true,
      isDemo: true,
      billingEmail: true,
      subscriptionStatus: true,
      paystackCustomerCode: true,
      paystackSubscriptionCode: true,
      planRenewsAt: true,
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({
    schools,
    liveBilling: isSubscriptionLive(),
    flutterwaveLive: isFlutterwaveLive(),
    pricesNgn: PLAN_PRICE_NGN_MONTHLY,
    planLimits: PLAN_LIMITS,
    envHint: {
      PAYSTACK_PLAN_STARTER: Boolean(process.env.PAYSTACK_PLAN_STARTER),
      PAYSTACK_PLAN_PRO: Boolean(process.env.PAYSTACK_PLAN_PRO),
      PAYSTACK_PLAN_ENTERPRISE: Boolean(process.env.PAYSTACK_PLAN_ENTERPRISE),
      FLUTTERWAVE: Boolean(process.env.FLUTTERWAVE_SECRET_KEY),
    },
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || !["PLATFORM_ADMIN", "ADMIN", "IT"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);

  if (body?.action === "subscribe") {
    const parsed = SubscribeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid subscribe payload" }, { status: 400 });
    }
    try {
      const result = await initializeSchoolSubscription({
        schoolId: parsed.data.schoolId,
        plan: parsed.data.plan as SaaSPlan,
        email: parsed.data.email,
      });
      await logAudit({
        userId: session.userId,
        action: "SAAS_SUBSCRIBE_INIT",
        entity: "School",
        entityId: parsed.data.schoolId,
        details: {
          plan: parsed.data.plan,
          mock: "mock" in result ? result.mock : false,
          provider: "paystack",
        },
      });
      return NextResponse.json(result);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  if (body?.action === "subscribe_flutterwave") {
    const parsed = SubscribeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid subscribe payload" }, { status: 400 });
    }
    try {
      const result = await initializeFlutterwaveSubscription({
        schoolId: parsed.data.schoolId,
        plan: parsed.data.plan as SaaSPlan,
        email: parsed.data.email,
      });
      await logAudit({
        userId: session.userId,
        action: "SAAS_SUBSCRIBE_INIT",
        entity: "School",
        entityId: parsed.data.schoolId,
        details: {
          plan: parsed.data.plan,
          mock: "mock" in result ? result.mock : false,
          provider: "flutterwave",
        },
      });
      return NextResponse.json(result);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  if (body?.action === "start_trial" || body?.action === "extend_trial" || body?.action === "end_trial") {
    if (session.role !== "PLATFORM_ADMIN" && session.role !== "IT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const schoolId = typeof body.schoolId === "string" ? body.schoolId : "";
    if (!schoolId) return NextResponse.json({ error: "schoolId required" }, { status: 400 });
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) return NextResponse.json({ error: "School not found" }, { status: 404 });

    if (body.action === "start_trial") {
      const days =
        typeof body.days === "number" && body.days > 0 ? Math.min(90, Math.floor(body.days)) : getTrialDays();
      const ends = trialEndsAt(new Date(), days);
      const updated = await prisma.school.update({
        where: { id: schoolId },
        data: {
          subscriptionStatus: "TRIAL",
          planRenewsAt: ends,
          isActive: true,
        },
      });
      await logAudit({
        userId: session.userId,
        action: "START_TRIAL",
        entity: "School",
        entityId: schoolId,
        details: { days, planRenewsAt: ends.toISOString() },
      });
      return NextResponse.json({
        ok: true,
        message: `Trial started/reset for ${updated.name} — ends ${ends.toISOString().slice(0, 10)} (${days} days).`,
        school: updated,
      });
    }

    if (body.action === "extend_trial") {
      const days =
        typeof body.days === "number" && body.days > 0 ? Math.min(90, Math.floor(body.days)) : 14;
      const base =
        school.planRenewsAt && school.planRenewsAt.getTime() > Date.now()
          ? school.planRenewsAt
          : new Date();
      const ends = trialEndsAt(base, days);
      const updated = await prisma.school.update({
        where: { id: schoolId },
        data: {
          subscriptionStatus: "TRIAL",
          planRenewsAt: ends,
          isActive: true,
        },
      });
      await logAudit({
        userId: session.userId,
        action: "EXTEND_TRIAL",
        entity: "School",
        entityId: schoolId,
        details: { days, planRenewsAt: ends.toISOString() },
      });
      return NextResponse.json({
        ok: true,
        message: `Trial extended by ${days} day(s) for ${updated.name} — now ends ${ends.toISOString().slice(0, 10)}.`,
        school: updated,
      });
    }

    const updated = await prisma.school.update({
      where: { id: schoolId },
      data: {
        subscriptionStatus: "MANUAL",
        planRenewsAt: null,
        isActive: true,
      },
    });
    await logAudit({
      userId: session.userId,
      action: "END_TRIAL",
      entity: "School",
      entityId: schoolId,
      details: { subscriptionStatus: "MANUAL" },
    });
    return NextResponse.json({
      ok: true,
      message: `Trial ended for ${updated.name}. Status MANUAL — no trial expiry. School remains active.`,
      school: updated,
    });
  }

  const parsed = SetPlanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan change" }, { status: 400 });
  }

  const plan = parsed.data.plan as SaaSPlan;
  const maxStudents =
    typeof parsed.data.maxStudents === "number"
      ? parsed.data.maxStudents
      : PLAN_LIMITS[plan];

  const school = await prisma.school.update({
    where: { id: parsed.data.schoolId },
    data: {
      plan,
      maxStudents,
      subscriptionStatus: "MANUAL",
    },
  });

  await logAudit({
    userId: session.userId,
    action: "SET_SCHOOL_PLAN",
    entity: "School",
    entityId: school.id,
    details: { plan: school.plan, maxStudents, customCap: Boolean(parsed.data.maxStudents) },
  });

  return NextResponse.json({
    school,
    billingNote:
      "Plan limits applied manually. Use action:subscribe or subscribe_flutterwave for checkout.",
  });
}
