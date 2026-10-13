import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { PortalShell } from "@/components/PortalShell";
import { can, homeRouteForRole } from "@/lib/permissions";
import { formatNaira, formatDateTime } from "@/lib/format";
import { resolveSchoolId, schoolWhere } from "@/lib/tenant-scope";
import { toMoney } from "@/lib/money";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireSession();

  if (session.role === "STUDENT" || session.role === "PARENT" || session.role === "TEACHER") {
    redirect(homeRouteForRole(session.role));
  }

  const schoolId = await resolveSchoolId(session);
  const sw = schoolWhere(schoolId);

  const [
    school,
    studentCount,
    pendingAdmissions,
    staffCount,
    classCount,
    todayAttendance,
    invoices,
    recentAudit,
    leavePending,
  ] = await Promise.all([
    schoolId
      ? prisma.school.findUnique({
          where: { id: schoolId },
          select: { name: true, shortName: true },
        })
      : Promise.resolve(null),
    prisma.student.count({ where: { status: "ACTIVE", ...sw } }),
    prisma.student.count({ where: { status: "APPLIED", ...sw } }),
    prisma.staff.count({ where: { isActive: true, ...sw } }),
    prisma.schoolClass.count({ where: sw }),
    prisma.attendance.findMany({
      where: {
        date: { gte: new Date(new Date().toDateString()) },
        ...(schoolId ? { student: { schoolId } } : {}),
      },
    }),
    prisma.invoice.findMany({
      where: schoolId ? { student: { schoolId } } : {},
      select: { totalAmount: true, amountPaid: true, status: true },
    }),
    prisma.auditLog.findMany({
      where: schoolId && session.role !== "PLATFORM_ADMIN" ? { schoolId } : {},
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { user: { select: { email: true } } },
    }),
    prisma.leaveRequest
      .count({
        where: {
          status: "PENDING",
          ...(schoolId ? { staff: { schoolId } } : {}),
        },
      })
      .catch(() => 0),
  ]);

  const collected = invoices.reduce((sum, i) => sum + toMoney(i.amountPaid), 0);
  const outstanding = invoices.reduce(
    (sum, i) => sum + (toMoney(i.totalAmount) - toMoney(i.amountPaid)),
    0
  );
  const presentToday = todayAttendance.filter((a) => a.status === "PRESENT").length;
  const attendancePct =
    todayAttendance.length > 0
      ? Math.round((presentToday / todayAttendance.length) * 100)
      : null;

  const showFinancials = can(session.role, "VIEW_DASHBOARD_FINANCIALS");
  const isAccounts = session.role === "ACCOUNTANT";
  const isPrincipal = session.role === "PRINCIPAL";
  const isSecretary = session.role === "SECRETARY";

  const attention: { href: string; label: string; tone?: "warn" | "info" }[] = [];
  if (pendingAdmissions > 0) {
    attention.push({
      href: "/students?status=APPLIED",
      label: `${pendingAdmissions} pending admission${pendingAdmissions === 1 ? "" : "s"}`,
      tone: "warn",
    });
  }
  if (showFinancials && outstanding > 0) {
    attention.push({
      href: "/fees",
      label: `${formatNaira(outstanding)} fees outstanding`,
      tone: "warn",
    });
  }
  if (leavePending > 0) {
    attention.push({
      href: "/leave",
      label: `${leavePending} leave request${leavePending === 1 ? "" : "s"} pending`,
      tone: "info",
    });
  }
  if (attendancePct === null) {
    attention.push({ href: "/attendance", label: "Attendance not taken today", tone: "info" });
  }

  const actions: { href: string; label: string; primary?: boolean }[] = [];
  if (can(session.role, "MANAGE_STUDENTS")) {
    actions.push({ href: "/students/new", label: "Admit student", primary: true });
  }
  if (showFinancials || isSecretary) {
    actions.push({ href: "/fees", label: "Collect fees" });
  }
  if (["ADMIN", "IT", "PLATFORM_ADMIN"].includes(session.role)) {
    actions.push({ href: "/attendance", label: "Attendance" });
  }
  if (["ADMIN", "PRINCIPAL", "SECRETARY", "IT", "PLATFORM_ADMIN"].includes(session.role)) {
    actions.push({ href: "/notices", label: "Post notice" });
  }
  if (isAccounts) {
    actions.push({ href: "/expenses", label: "Expense" });
    actions.push({ href: "/payroll", label: "Payroll" });
  }
  if (isPrincipal) {
    actions.push({ href: "/reports", label: "Reports" });
  }
  if (session.role === "PLATFORM_ADMIN") {
    actions.push({ href: "/platform", label: "Platform" });
  }

  const schoolLabel = school
    ? `${school.name}${school.shortName ? ` · ${school.shortName}` : ""}`
    : "School workspace";

  return (
    <PortalShell
      role={session.role}
      title="Dashboard"
      subtitle={schoolLabel}
      email={session.email}
    >
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        <Kpi label="Active students" value={studentCount.toLocaleString()} />
        <Kpi label="Staff on roll" value={staffCount.toLocaleString()} />
        <Kpi label="Classes" value={classCount.toLocaleString()} />
        <Kpi
          label="Attendance today"
          value={attendancePct !== null ? `${attendancePct}%` : "—"}
          sub={
            todayAttendance.length
              ? `${presentToday}/${todayAttendance.length} present`
              : "Not taken"
          }
          valueClass={
            attendancePct === null
              ? "text-ink/40"
              : attendancePct >= 80
                ? "text-sage"
                : attendancePct >= 50
                  ? "text-navy"
                  : "text-brick"
          }
        />
      </div>

      {showFinancials && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <Kpi label="Fees collected" value={formatNaira(collected)} valueClass="text-sage" />
          <Kpi
            label="Outstanding"
            value={formatNaira(outstanding)}
            valueClass={outstanding > 0 ? "text-brick" : "text-ink"}
          />
        </div>
      )}

      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {actions.map((a) => (
            <Link
              key={a.href + a.label}
              href={a.href}
              className={a.primary ? "btn-primary" : "btn-ghost"}
            >
              {a.label}
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <section className="ledger-block">
          <h2 className="font-serif text-lg text-navy mb-3">Needs attention</h2>
          {attention.length === 0 ? (
            <p className="text-sm text-ink/40 py-6 text-center">Nothing urgent right now.</p>
          ) : (
            <ul className="space-y-2">
              {attention.map((item) => (
                <li key={item.href + item.label}>
                  <Link
                    href={item.href}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors hover:border-navy/30 ${
                      item.tone === "warn"
                        ? "border-brick/25 bg-brick/5 text-brick"
                        : "border-line bg-paper text-ink/80"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="text-[11px] opacity-55 font-medium">Open →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="ledger-block">
          <h2 className="font-serif text-lg text-navy mb-3">Recent activity</h2>
          {recentAudit.length === 0 ? (
            <p className="text-sm text-ink/40 py-6 text-center">No activity yet.</p>
          ) : (
            <ul className="divide-y divide-line/80">
              {recentAudit.map((log) => (
                <li key={log.id} className="py-2.5 text-sm">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-ink/70 truncate max-w-[55%]">
                      {log.user?.email ?? "System"}
                    </span>
                    <span className="status-pill text-navy border-navy/25 bg-navy/5 !normal-case !tracking-normal !font-mono !text-[10px]">
                      {log.action}
                    </span>
                  </div>
                  <p className="text-[11px] text-ink/40 mt-0.5">{formatDateTime(log.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PortalShell>
  );
}

function Kpi({
  label,
  value,
  sub,
  valueClass = "text-navy",
}: {
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
}) {
  return (
    <div className="ledger-block !p-3 sm:!p-3.5">
      <p className="text-[10px] uppercase tracking-wide text-ink/50">{label}</p>
      <p className={`ledger-number text-xl sm:text-2xl mt-0.5 tabular-nums ${valueClass}`}>
        {value}
      </p>
      {sub ? <p className="text-[11px] text-ink/45 mt-0.5">{sub}</p> : null}
    </div>
  );
}
