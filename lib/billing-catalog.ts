/**
 * Public SaaS pricing catalog (NGN monthly).
 * Align Paystack/Flutterwave plan amounts with these numbers in each dashboard.
 */
import { PLAN_STUDENT_CAPS, type PlanId } from "@/lib/plan-caps";

export type BillingProvider = "paystack" | "flutterwave" | "manual";

export const PLAN_PRICE_NGN_MONTHLY: Record<PlanId, number> = {
  STARTER: 20_000,
  PRO: 60_000,
  ENTERPRISE: 150_000,
};

export const PLAN_PRICE_KOBO: Record<PlanId, number> = {
  STARTER: PLAN_PRICE_NGN_MONTHLY.STARTER * 100,
  PRO: PLAN_PRICE_NGN_MONTHLY.PRO * 100,
  ENTERPRISE: PLAN_PRICE_NGN_MONTHLY.ENTERPRISE * 100,
};

export function formatPlanPriceNgn(plan: string): string {
  const key = (plan || "STARTER").toUpperCase() as PlanId;
  const n = PLAN_PRICE_NGN_MONTHLY[key] ?? PLAN_PRICE_NGN_MONTHLY.STARTER;
  return `₦${n.toLocaleString("en-NG")}/mo`;
}

export function planLabel(plan: string): string {
  const key = (plan || "STARTER").toUpperCase() as PlanId;
  const cap = PLAN_STUDENT_CAPS[key] ?? PLAN_STUDENT_CAPS.STARTER;
  return `${key} · up to ${cap.toLocaleString()} students · ${formatPlanPriceNgn(key)}`;
}

export const BILLING_ENV_HINT = {
  paystack: [
    "PAYSTACK_SECRET_KEY",
    "PAYSTACK_WEBHOOK_SECRET",
    "PAYSTACK_PLAN_STARTER",
    "PAYSTACK_PLAN_PRO",
    "PAYSTACK_PLAN_ENTERPRISE",
    "NEXT_PUBLIC_APP_URL",
  ],
  flutterwave: [
    "FLUTTERWAVE_SECRET_KEY",
    "FLUTTERWAVE_WEBHOOK_HASH", // optional secret hash header
    "FLUTTERWAVE_PLAN_STARTER", // optional payment_plan ids
    "FLUTTERWAVE_PLAN_PRO",
    "FLUTTERWAVE_PLAN_ENTERPRISE",
    "NEXT_PUBLIC_APP_URL",
  ],
} as const;
