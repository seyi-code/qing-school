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
    studentCount,
    pendingAdmissions,
    staffCount,
    classCount,
    todayAttendance,
    invoices,
    recentAudit,
    leavePending,
  ] = await Promise.all([
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

  return (
    <PortalShell
      role={session.role}
      title="Dashboard"
      subtitle={`Welcome back · ${session.email}`}
      email={session.email}
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-3 mb-4 sm:mb-5">
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
        />
      </div>

      {showFinancials && (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-4 sm:mb-5">
          <Kpi label="Fees collected" value={formatNaira(collected)} valueClass="text-sage" />
          <Kpi
            label="Outstanding"
            value={formatNaira(outstanding)}
            valueClass={outstanding > 0 ? "text-brick" : "text-ink"}
          />
        </div>
      )}

      {/* Primary actions */}
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 sm:mb-5">
          {actions.map((a) => (
            <Link
              key={a.href + a.label}
              href={a.href}
              className={
                a.primary
                  ? "inline-flex items-center rounded-lg bg-navy px-3.5 py-2 text-xs font-medium text-paper hover:bg-navy-light"
                  : "inline-flex items-center rounded-lg border border-line bg-white px-3.5 py-2 text-xs font-medium text-ink hover:border-navy/40"
              }
            >
              {a.label}
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-5">
        <section className="rounded-xl border border-line bg-white p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-ink mb-3">Needs attention</h2>
          {attention.length === 0 ? (
            <p className="text-sm text-ink/40 py-4 text-center">Nothing urgent right now.</p>
          ) : (
            <ul className="space-y-2">
              {attention.map((item) => (
                <li key={item.href + item.label}>
                  <Link
                    href={item.href}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm hover:border-navy/30 ${
                      item.tone === "warn"
                        ? "border-brick/20 bg-brick/5 text-brick"
                        : "border-line bg-paper text-ink/80"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="text-xs opacity-60">Open →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-line bg-white p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-ink mb-3">Recent activity</h2>
          {recentAudit.length === 0 ? (
            <p className="text-sm text-ink/40 py-4 text-center">No activity yet.</p>
          ) : (
            <ul className="divide-y divide-line/80">
              {recentAudit.map((log) => (
                <li key={log.id} className="py-2.5 text-sm">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="text-ink/70 truncate max-w-[60%]">
                      {log.user?.email ?? "System"}
                    </span>
                    <span className="font-mono text-[11px] text-navy/80">{log.action}</span>
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
  valueClass = "text-ink",
}: {
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-white px-3.5 py-3 sm:px-4 sm:py-3.5">
      <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-ink/45">
        {label}
      </p>
      <p className={`mt-1 text-lg sm:text-xl font-semibold tracking-tight tabular-nums ${valueClass}`}>
        {value}
      </p>
      {sub ? <p className="text-[11px] text-ink/40 mt-0.5">{sub}</p> : null}
    </div>
  );
}
