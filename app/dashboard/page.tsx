import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { PortalShell } from "@/components/PortalShell";
import { can, homeRouteForRole } from "@/lib/permissions";
import { formatNaira, formatDateTime } from "@/lib/format";
import { resolveSchoolId, schoolWhere } from "@/lib/tenant-scope";
import { toMoney } from "@/lib/money";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionTile } from "@/components/ui/ActionTile";

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
  if (leavePending > 0 && !isAccounts) {
    attention.push({
      href: "/leave",
      label: `${leavePending} leave request${leavePending === 1 ? "" : "s"} pending`,
      tone: "info",
    });
  }
  if (attendancePct === null && !isAccounts) {
    attention.push({ href: "/attendance", label: "Attendance not taken today", tone: "info" });
  }

  const actions: {
    href: string;
    label: string;
    icon: string;
    description?: string;
    primary?: boolean;
  }[] = [];
  if (can(session.role, "MANAGE_STUDENTS") && !isAccounts) {
    actions.push({
      href: "/students/new",
      label: "Admit student",
      icon: "🎓",
      description: "Register a new learner",
      primary: true,
    });
  }
  if (showFinancials || isSecretary || isAccounts) {
    actions.push({
      href: "/fees",
      label: "Collect fees",
      icon: "₦",
      description: "Invoices & payments",
      primary: isAccounts,
    });
  }
  if (["ADMIN", "IT", "PLATFORM_ADMIN", "TEACHER", "PRINCIPAL"].includes(session.role)) {
    actions.push({
      href: "/attendance",
      label: "Attendance",
      icon: "✓",
      description: "Mark class register",
    });
  }
  if (["ADMIN", "PRINCIPAL", "SECRETARY", "IT", "PLATFORM_ADMIN"].includes(session.role)) {
    actions.push({
      href: "/notices",
      label: "Post notice",
      icon: "📢",
      description: "School announcements",
    });
  }
  if (isAccounts) {
    actions.push({
      href: "/expenses",
      label: "Record expense",
      icon: "💸",
      description: "School spending",
    });
    actions.push({
      href: "/payroll",
      label: "Payroll",
      icon: "💼",
      description: "Staff salaries",
    });
  }
  if (isPrincipal) {
    actions.push({
      href: "/reports",
      label: "Reports",
      icon: "📊",
      description: "Exports & analytics",
    });
  }
  if (["ADMIN", "IT", "PLATFORM_ADMIN", "TEACHER", "PRINCIPAL"].includes(session.role)) {
    actions.push({
      href: "/exams",
      label: "Scores / CA",
      icon: "📝",
      description: "Enter continuous assessment",
    });
  }
  if (session.role === "PLATFORM_ADMIN") {
    actions.push({
      href: "/platform",
      label: "Platform",
      icon: "◆",
      description: "Tenants & billing",
    });
  }

  const welcome =
    session.role === "PLATFORM_ADMIN"
      ? "Working as selected tenant · use sidebar for school ops"
      : session.role === "ACCOUNTANT"
        ? "Finance overview"
        : session.role === "PRINCIPAL"
          ? "School operations overview"
          : "Welcome back";

  const attTone =
    attendancePct === null
      ? "slate"
      : attendancePct >= 80
        ? "sage"
        : attendancePct >= 50
          ? "sky"
          : "brick";

  const unpaidCount = invoices.filter((i) => i.status === "UNPAID" || i.status === "PARTIAL").length;

  return (
    <PortalShell role={session.role} title="Dashboard" subtitle={welcome} email={session.email}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-navy/50 mb-2">
        {isAccounts
          ? "Accounts command centre"
          : isPrincipal
            ? "Principal command centre"
            : isSecretary
              ? "Front office command centre"
              : "School command centre"}
      </p>

      {isAccounts ? (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
          <Kpi label="Fees collected" value={formatNaira(collected)} tone="sage" icon="₦" />
          <Kpi
            label="Outstanding"
            value={formatNaira(outstanding)}
            tone={outstanding > 0 ? "brick" : "sage"}
            icon="!"
          />
          <Kpi label="Open invoices" value={unpaidCount.toLocaleString()} tone="gold" icon="#" />
          <Kpi label="Active students" value={studentCount.toLocaleString()} tone="navy" icon="🎓" />
        </div>
      ) : isPrincipal ? (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
          <Kpi label="Active students" value={studentCount.toLocaleString()} tone="navy" icon="🎓" />
          <Kpi label="Staff on roll" value={staffCount.toLocaleString()} tone="violet" icon="👥" />
          <Kpi
            label="Attendance today"
            value={attendancePct !== null ? `${attendancePct}%` : "—"}
            sub={
              todayAttendance.length
                ? `${presentToday}/${todayAttendance.length} present`
                : "Not taken"
            }
            tone={attTone}
            icon="✓"
          />
          <Kpi
            label="Leave pending"
            value={leavePending.toLocaleString()}
            tone={leavePending ? "gold" : "sage"}
            icon="…"
          />
        </div>
      ) : isSecretary ? (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
          <Kpi label="Active students" value={studentCount.toLocaleString()} tone="navy" icon="🎓" />
          <Kpi
            label="Pending admissions"
            value={pendingAdmissions.toLocaleString()}
            tone={pendingAdmissions ? "gold" : "sage"}
            icon="+"
          />
          {showFinancials ? (
            <Kpi
              label="Outstanding"
              value={formatNaira(outstanding)}
              tone={outstanding > 0 ? "brick" : "sage"}
              icon="!"
            />
          ) : (
            <Kpi label="Classes" value={classCount.toLocaleString()} tone="gold" icon="📚" />
          )}
          <Kpi
            label="Attendance today"
            value={attendancePct !== null ? `${attendancePct}%` : "—"}
            tone={attTone}
            icon="✓"
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
            <Kpi label="Active students" value={studentCount.toLocaleString()} tone="navy" icon="🎓" />
            <Kpi label="Staff on roll" value={staffCount.toLocaleString()} tone="violet" icon="👥" />
            <Kpi label="Classes" value={classCount.toLocaleString()} tone="gold" icon="📚" />
            <Kpi
              label="Attendance today"
              value={attendancePct !== null ? `${attendancePct}%` : "—"}
              sub={
                todayAttendance.length
                  ? `${presentToday}/${todayAttendance.length} present`
                  : "Not taken"
              }
              tone={attTone}
              icon="✓"
            />
          </div>
          {showFinancials && (
            <div className="grid grid-cols-2 gap-3 mb-5">
              <Kpi label="Fees collected" value={formatNaira(collected)} tone="sage" icon="₦" />
              <Kpi
                label="Outstanding"
                value={formatNaira(outstanding)}
                tone={outstanding > 0 ? "brick" : "sage"}
                icon="!"
              />
            </div>
          )}
        </>
      )}

      {actions.length > 0 && (
        <div className="mb-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#627184] mb-2">
            Quick actions
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {actions.map((a) => (
              <ActionTile
                key={a.href + a.label}
                href={a.href}
                label={a.label}
                icon={a.icon}
                description={a.description}
                primary={a.primary}
              />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <section className="rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-white p-4 sm:p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-sm">⚠</span>
            <h2 className="font-serif text-lg text-navy">Needs attention</h2>
          </div>
          {attention.length === 0 ? (
            <p className="text-sm text-sage py-6 text-center font-medium">All clear — nothing urgent right now.</p>
          ) : (
            <ul className="space-y-2">
              {attention.map((item) => (
                <li key={item.href + item.label}>
                  <Link
                    href={item.href}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                      item.tone === "warn"
                        ? "border-rose-200 bg-rose-50 text-rose-800 hover:border-rose-300"
                        : "border-sky-200 bg-sky-50 text-sky-900 hover:border-sky-300"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="text-[11px] opacity-60 font-medium">Open →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-white p-4 sm:p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-sm">⏱</span>
            <h2 className="font-serif text-lg text-navy">Recent activity</h2>
          </div>
          {recentAudit.length === 0 ? (
            <p className="text-sm text-ink/50 py-6 text-center">No recent audit entries.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {recentAudit.map((log) => (
                <li key={log.id} className="border-b border-line/60 pb-2 last:border-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-ink/80">{log.action}</span>
                    <span className="inline-flex items-center rounded-md bg-indigo-100/90 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-indigo-800 shrink-0">
                      {formatDateTime(log.createdAt)}
                    </span>
                  </div>
                  <p className="text-[11px] text-ink/45 mt-0.5">{log.user?.email || "System"}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PortalShell>
  );
}

type KpiTone = "navy" | "violet" | "gold" | "sage" | "brick" | "sky" | "slate";

const TONE: Record<
  KpiTone,
  { card: string; label: string; value: string; badge: string }
> = {
  navy: {
    card: "border-navy/20 bg-gradient-to-br from-[#1a3a6e]/[12%] to-white",
    label: "text-navy/60",
    value: "text-navy",
    badge: "bg-navy/10 text-navy",
  },
  violet: {
    card: "border-violet-200/90 bg-gradient-to-br from-violet-50 to-white",
    label: "text-violet-700/70",
    value: "text-violet-900",
    badge: "bg-violet-100 text-violet-800",
  },
  gold: {
    card: "border-amber-200/90 bg-gradient-to-br from-amber-50 to-white",
    label: "text-amber-800/70",
    value: "text-amber-900",
    badge: "bg-amber-100 text-amber-900",
  },
  sage: {
    card: "border-emerald-200/90 bg-gradient-to-br from-emerald-50 to-white",
    label: "text-emerald-700/70",
    value: "text-emerald-800",
    badge: "bg-emerald-100 text-emerald-800",
  },
  brick: {
    card: "border-rose-200/90 bg-gradient-to-br from-rose-50 to-white",
    label: "text-rose-700/70",
    value: "text-rose-800",
    badge: "bg-rose-100 text-rose-800",
  },
  sky: {
    card: "border-sky-200/90 bg-gradient-to-br from-sky-50 to-white",
    label: "text-sky-700/70",
    value: "text-sky-900",
    badge: "bg-sky-100 text-sky-800",
  },
  slate: {
    card: "border-slate-200 bg-gradient-to-br from-slate-50 to-white",
    label: "text-slate-500",
    value: "text-slate-500",
    badge: "bg-slate-100 text-slate-600",
  },
};

function Kpi({
  label,
  value,
  sub,
  tone = "navy",
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: KpiTone;
  icon?: string;
}) {
  const t = TONE[tone];
  return (
    <div className={`rounded-xl border px-3.5 py-3 sm:px-4 sm:py-3.5 shadow-sm ${t.card}`}>
      <div className="flex items-start justify-between gap-2">
        <p className={`text-[10px] uppercase tracking-wide font-medium ${t.label}`}>{label}</p>
        {icon ? (
          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold ${t.badge}`}>
            {icon}
          </span>
        ) : null}
      </div>
      <p className={`mt-1.5 text-xl sm:text-2xl font-semibold tracking-tight tabular-nums ${t.value}`}>{value}</p>
      {sub ? <p className={`text-[11px] mt-0.5 ${t.label}`}>{sub}</p> : null}
    </div>
  );
}
