/** Shared dashboard-style KPI tile with optional icon badge. */
export type KpiTone = "navy" | "sky" | "sage" | "gold" | "violet" | "rose" | "slate";

const TONE: Record<
  KpiTone,
  { card: string; label: string; value: string; badge: string }
> = {
  navy: {
    card: "border-navy/15 bg-gradient-to-br from-[#1a3a6e]/[12%] to-white",
    label: "text-navy/55",
    value: "text-navy",
    badge: "bg-navy/10 text-navy",
  },
  sky: {
    card: "border-sky-500/20 bg-gradient-to-br from-sky-500/[12%] to-white",
    label: "text-sky-700/70",
    value: "text-sky-900",
    badge: "bg-sky-100 text-sky-800",
  },
  sage: {
    card: "border-emerald-500/20 bg-gradient-to-br from-emerald-500/[12%] to-white",
    label: "text-emerald-700/70",
    value: "text-emerald-900",
    badge: "bg-emerald-100 text-emerald-800",
  },
  gold: {
    card: "border-amber-500/25 bg-gradient-to-br from-amber-500/[12%] to-white",
    label: "text-amber-800/70",
    value: "text-amber-950",
    badge: "bg-amber-100 text-amber-900",
  },
  violet: {
    card: "border-violet-500/20 bg-gradient-to-br from-violet-500/[12%] to-white",
    label: "text-violet-700/70",
    value: "text-violet-900",
    badge: "bg-violet-100 text-violet-800",
  },
  rose: {
    card: "border-rose-500/20 bg-gradient-to-br from-rose-500/[12%] to-white",
    label: "text-rose-700/70",
    value: "text-rose-900",
    badge: "bg-rose-100 text-rose-800",
  },
  slate: {
    card: "border-slate-200 bg-gradient-to-br from-slate-50 to-white",
    label: "text-slate-500",
    value: "text-slate-600",
    badge: "bg-slate-100 text-slate-600",
  },
};

export function Kpi({
  label,
  value,
  sub,
  tone = "navy",
  icon,
  className = "",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: KpiTone;
  icon?: string;
  className?: string;
}) {
  const t = TONE[tone] ?? TONE.navy;
  return (
    <div className={`rounded-xl border px-3.5 py-3 sm:px-4 sm:py-3.5 shadow-sm ${t.card} ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <p className={`text-[10px] uppercase tracking-wide font-medium ${t.label}`}>{label}</p>
        {icon ? (
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold ${t.badge}`}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <p className={`mt-1.5 text-xl sm:text-2xl font-semibold tracking-tight tabular-nums ${t.value}`}>
        {value}
      </p>
      {sub ? <p className={`text-[11px] mt-0.5 ${t.label}`}>{sub}</p> : null}
    </div>
  );
}
