/** Trial period for newly onboarded schools. */

export function getTrialDays(): number {
  const raw = process.env.TRIAL_DAYS;
  const n = raw ? parseInt(raw, 10) : 14;
  if (!Number.isFinite(n) || n < 1) return 14;
  if (n > 90) return 90; // hard ceiling
  return n;
}

/** End of trial (end of day UTC-ish) from a start date. */
export function trialEndsAt(from: Date = new Date(), days = getTrialDays()): Date {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

export function isTrialExpired(
  status: string | null | undefined,
  endsAt: Date | null | undefined,
  now = new Date()
): boolean {
  if ((status || "").toUpperCase() !== "TRIAL") return false;
  if (!endsAt) return false; // no end date = trial does not auto-expire (legacy)
  return endsAt.getTime() < now.getTime();
}
