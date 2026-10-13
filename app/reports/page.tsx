import { requireSession } from "@/lib/require-session";
import { PortalShell } from "@/components/PortalShell";
import { can } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { homeRouteForRole } from "@/lib/permissions";

const REPORTS = [
  {
    title: "Student List",
    description: "All active students, with class and gender, as a spreadsheet.",
    href: "/api/reports/students",
    tone: "navy" as const,
    icon: "🎓",
  },
  {
    title: "Fee Defaulters",
    description: "Every student with an unpaid or partially paid invoice.",
    href: "/api/reports/debtors",
    tone: "rose" as const,
    icon: "₦",
  },
  {
    title: "Attendance Sheet (last 30 days)",
    description: "Daily attendance status for every student, most recent first.",
    href: "/api/reports/attendance?days=30",
    tone: "sage" as const,
    icon: "✓",
  },
];

const TONE = {
  navy: "from-blue-50 to-white border-blue-200/90",
  rose: "from-rose-50 to-white border-rose-200/90",
  sage: "from-emerald-50 to-white border-emerald-200/90",
  gold: "from-amber-50 to-white border-amber-200/90",
};

export default async function ReportsPage() {
  const session = await requireSession();
  if (!can(session.role, "VIEW_REPORTS")) redirect(homeRouteForRole(session.role));

  return (
    <PortalShell
      role={session.role}
      title="Reports"
      subtitle="Export data as a spreadsheet (CSV)"
      email={session.email}
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {REPORTS.map((r) => (
          <div
            key={r.href}
            className={`rounded-xl border bg-gradient-to-br p-4 sm:p-5 shadow-sm flex flex-col justify-between min-h-[11rem] ${TONE[r.tone]}`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h2 className="font-serif text-lg text-navy leading-snug">{r.title}</h2>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/80 text-sm shadow-sm">
                  {r.icon}
                </span>
              </div>
              <p className="text-sm text-ink/60 leading-relaxed">{r.description}</p>
            </div>
            <a href={r.href} className="btn-primary mt-4 w-fit text-sm">
              Download CSV
            </a>
          </div>
        ))}
      </div>
    </PortalShell>
  );
}
