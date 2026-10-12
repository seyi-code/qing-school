import type { ReactNode } from "react";

/** Shared surface for portal/admin screens — rounded card, tight padding. */
export function Card({
  title,
  action,
  children,
  className = "",
  flush = false,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return (
    <section
      className={`rounded-xl border border-line bg-white ${flush ? "overflow-hidden" : "p-4 sm:p-5"} ${className}`}
    >
      {(title || action) && (
        <div
          className={`flex items-center justify-between gap-2 mb-3 ${flush ? "px-4 pt-4 sm:px-5 sm:pt-5" : ""}`}
        >
          {title ? <h2 className="text-sm font-semibold text-ink">{title}</h2> : <span />}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tone =
    status === "PAID" || status === "PRESENT" || status === "ACTIVE"
      ? "bg-sage/15 text-sage border-sage/30"
      : status === "PARTIAL" || status === "LATE" || status === "APPLIED"
        ? "bg-gold/15 text-gold-dark border-gold/30"
        : status === "UNPAID" || status === "ABSENT" || status === "WITHDRAWN"
          ? "bg-brick/10 text-brick border-brick/25"
          : "bg-ink/5 text-ink/60 border-line";
  return (
    <span
      className={`inline-flex text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md border ${tone}`}
    >
      {status}
    </span>
  );
}
