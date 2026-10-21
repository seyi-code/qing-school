/** Default student caps by subscription plan. */
export const PLAN_STUDENT_CAPS = {
  STARTER: 500,
  PRO: 2000,
  ENTERPRISE: 10000,
} as const;

export type PlanId = keyof typeof PLAN_STUDENT_CAPS;

export function studentCapForPlan(plan: string | null | undefined): number {
  const key = (plan || "STARTER").toUpperCase() as PlanId;
  return PLAN_STUDENT_CAPS[key] ?? PLAN_STUDENT_CAPS.STARTER;
}
