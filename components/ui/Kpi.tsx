/** Shared dashboard-style KPI tile with optional icon badge. */
export type KpiTone = "navy" | "sky" | "sage" | "gold" | "violet" | "rose" | "slate";

const TONE: Record<
  KpiTone,
  { card: string; label: string; value: string; badge: string }
> = {
  navy: {
    card: "border-[#12345a]/15 bg-gradient-to-br from-[#12345a]/[10%] to-white",
    label: "text-[#12345a]/60",
    value: "text-[#12345a]",
    badge: "bg-[#12345a]/10 text-[#12345a]",
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
    card: "border-[#d2ae3b]/35 bg-gradient-to-br from-[#d2ae3b]/[14%] to-white",
    label: "text-[#9a7820]/80",
    value: "text-[#6b5412]",
    badge: "bg-[#d2ae3b]/20 text-[#6b5412]",
  },
  violet: {
    card: "border-violet-500/20 bg-gradient-to-br from-violet-500/[12%] to-white",
    label: "text-violet-700/70",
    value: "text-violet-900",
    badge: "bg-violet-100 text-violet-800",
  },
  rose: {
    card: "border-[#b3234b]/20 bg-gradient-to-br from-[#b3234b]/[10%] to-white",
    label: "text-[#b3234b]/70",
    value: "text-[#8a1a38]",
    badge: "bg-[#b3234b]/10 text-[#b3234b]",
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
  wide = false,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: KpiTone;
  icon?: string;
  className?: string;
  /** Span 2 columns on small grids when useful */
  wide?: boolean;
}) {
  const t = TONE[tone] ?? TONE.navy;
  return (
    <div
      className={`rounded-2xl border px-3.5 py-3.5 sm:px-4 sm:py-4 shadow-sm ${t.card} ${
        wide ? "col-span-2 sm:col-span-1" : ""
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={`text-[10px] uppercase tracking-[0.08em] font-semibold ${t.label}`}>{label}</p>
        {icon ? (
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-semibold ${t.badge}`}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <p className={`mt-2 text-xl sm:text-2xl font-bold tracking-tight tabular-nums ${t.value}`}>
        {value}
      </p>
      {sub ? <p className={`mt-1 text-[11px] ${t.label}`}>{sub}</p> : null}
    </div>
  );
}
