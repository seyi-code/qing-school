import Link from "next/link";

/** Role dashboard quick-action tile — matches KPI / marketing icon language. */
export function ActionTile({
  href,
  label,
  description,
  icon,
  primary = false,
}: {
  href: string;
  label: string;
  description?: string;
  icon: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-start gap-3 rounded-2xl border px-3.5 py-3.5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 ${
        primary
          ? "border-[#12345a]/25 bg-gradient-to-br from-[#12345a]/[12%] to-white"
          : "border-[#e3e8ed] bg-white hover:border-[#12345a]/25"
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${
          primary ? "bg-[#12345a] text-white" : "bg-[#f0f4f8] text-[#12345a]"
        }`}
        aria-hidden
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-[#12345a] group-hover:text-[#b3234b]">
          {label}
        </span>
        {description ? (
          <span className="block text-[11px] text-[#627184] mt-0.5 leading-snug">{description}</span>
        ) : null}
      </span>
    </Link>
  );
}
