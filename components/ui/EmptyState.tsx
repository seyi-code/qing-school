import type { ReactNode } from "react";

/** Consistent empty list / no-data surface for portal tables. */
export function EmptyState({
  title,
  description,
  action,
  icon = "📭",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: string;
}) {
  return (
    <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-[#e3e8ed] bg-white shadow-sm">
      <span
        className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#12345a]/8 text-xl"
        aria-hidden
      >
        {icon}
      </span>
      <p className="font-serif text-lg text-[#12345a]">{title}</p>
      {description && (
        <p className="text-sm text-[#627184] mt-2 max-w-md mx-auto leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5 flex justify-center gap-2 flex-wrap">{action}</div>}
    </div>
  );
}
