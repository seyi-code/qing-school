import type { ReactNode } from "react";

/** Shared surface for portal/admin screens — rounded card, tight padding. */
export function Card({
  title,
  action,
  children,
  className = "",
  flush = false,
  icon,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  flush?: boolean;
  icon?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-[#e3e8ed] bg-white shadow-sm ${
        flush ? "overflow-hidden" : "p-4 sm:p-5"
      } ${className}`}
    >
      {(title || action) && (
        <div
          className={`flex items-center justify-between gap-2 mb-3 ${
            flush ? "px-4 pt-4 sm:px-5 sm:pt-5" : ""
          }`}
        >
          {title ? (
            <h2 className="text-sm font-semibold text-[#12345a] flex items-center gap-2">
              {icon ? (
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#12345a]/8 text-sm">
                  {icon}
                </span>
              ) : null}
              {title}
            </h2>
          ) : (
            <span />
          )}
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
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : status === "PARTIAL" || status === "LATE" || status === "APPLIED"
        ? "bg-amber-50 text-amber-900 border-amber-200"
        : status === "UNPAID" || status === "ABSENT" || status === "WITHDRAWN"
          ? "bg-rose-50 text-rose-800 border-rose-200"
          : "bg-slate-50 text-slate-600 border-slate-200";
  return (
    <span
      className={`inline-flex text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md border ${tone}`}
    >
      {status}
    </span>
  );
}
