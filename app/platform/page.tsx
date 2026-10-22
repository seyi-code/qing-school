import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ensureDefaultSchool, backfillSchoolIds } from "@/lib/tenant";
import { PlatformBillingForm } from "@/components/PlatformBillingForm";
import { PlatformTrialForm } from "@/components/PlatformTrialForm";
import { isSubscriptionLive, PLAN_LIMITS } from "@/lib/integrations/subscriptions";
import { PortalShell } from "@/components/PortalShell";
import { WorkAsSchoolButton } from "@/components/WorkAsSchoolButton";
import { IsolationProbeCard } from "@/components/IsolationProbeCard";
import { getActiveSchoolIdFromCookie } from "@/lib/tenant-scope";
import { formatDate } from "@/lib/format";
import { isTrialExpired } from "@/lib/trial";
import { ActionTile } from "@/components/ui/ActionTile";

export const dynamic = "force-dynamic";

function subPillClass(status: string, expired: boolean): string {
  if (expired) return "status-pill text-brick border-brick/40 bg-brick/5";
  const s = status.toUpperCase();
  if (s === "TRIAL") return "status-pill text-navy border-navy/30 bg-navy/5";
  if (s === "ACTIVE" || s === "MANUAL") return "status-pill text-sage border-sage/40 bg-sage/5";
  if (s === "PAST_DUE" || s === "SUSPENDED" || s === "CANCELLED")
    return "status-pill text-brick border-brick/40 bg-brick/5";
  return "status-pill text-ink/60 border-line bg-paper";
}

type KpiTone = "navy" | "sage" | "gold" | "violet";

const KPI_TONE: Record<
  KpiTone,
  { card: string; label: string; value: string; badge: string }
> = {
  navy: {
    card: "border-navy/20 bg-gradient-to-br from-[#1a3a6e]/[12%] to-white",
    label: "text-navy/60",
    value: "text-navy",
    badge: "bg-navy/10 text-navy",
  },
  sage: {
    card: "border-emerald-200/90 bg-gradient-to-br from-emerald-50 to-white",
    label: "text-emerald-700/70",
    value: "text-emerald-800",
    badge: "bg-emerald-100 text-emerald-800",
  },
  gold: {
    card: "border-amber-200/90 bg-gradient-to-br from-amber-50 to-white",
    label: "text-amber-800/70",
    value: "text-amber-900",
    badge: "bg-amber-100 text-amber-900",
  },
  violet: {
    card: "border-violet-200/90 bg-gradient-to-br from-violet-50 to-white",
    label: "text-violet-700/70",
    value: "text-violet-900",
    badge: "bg-violet-100 text-violet-800",
  },
};

function PlatformKpi({
  label,
  value,
  icon,
  tone = "navy",
}: {
  label: string;
  value: string | number;
  icon: string;
  tone?: KpiTone;
}) {
  const t = KPI_TONE[tone];
  return (
    <div className={`rounded-xl border px-3.5 py-3 sm:px-4 sm:py-3.5 shadow-sm ${t.card}`}>
      <div className="flex items-start justify-between gap-2">
        <p className={`text-[10px] uppercase tracking-wide font-medium ${t.label}`}>{label}</p>
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold ${t.badge}`}
          aria-hidden
        >
          {icon}
        </span>
      </div>
      <p className={`mt-1.5 text-xl sm:text-2xl font-semibold tracking-tight tabular-nums ${t.value}`}>
        {value}
      </p>
    </div>
  );
}

export default async function PlatformPage() {
  const session = await requireSession();
  if (!["PLATFORM_ADMIN", "ADMIN", "IT"].includes(session.role)) {
    redirect("/dashboard");
  }

  const defaultSchool = await ensureDefaultSchool();
  if (session.role === "PLATFORM_ADMIN" || session.role === "IT") {
    await backfillSchoolIds(defaultSchool.id);
  }

  const schools = await prisma.school.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { users: true, students: true } } },
  });

  const live = isSubscriptionLive();
  const activeId = await getActiveSchoolIdFromCookie();
  const activeSchool = activeId
    ? schools.find((s) => s.id === activeId)
    : defaultSchool;

  const activeCount = schools.filter((s) => s.isActive).length;
  const trialCount = schools.filter(
    (s) => (s.subscriptionStatus || "").toUpperCase() === "TRIAL"
  ).length;
  const totalStudents = schools.reduce((n, s) => n + s._count.students, 0);

  return (
    <PortalShell
      role={session.role}
      title="Platform · Schools & Billing"
      subtitle="SaaS control plane — all tenants"
      email={session.email}
      actions={
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href="/onboarding" className="btn-primary">
            Onboard school
          </Link>
          <Link href="/platform/domains" className="btn-ghost">
            Custom domains
          </Link>
          <Link href="/dashboard" className="btn-ghost">
            School dashboard
          </Link>
        </div>
      }
    >
      <div className="space-y-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-navy/50">
          Platform command centre
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <PlatformKpi label="Schools" value={schools.length} icon="🏫" tone="navy" />
          <PlatformKpi label="Active" value={activeCount} icon="✓" tone="sage" />
          <PlatformKpi label="On trial" value={trialCount} icon="⏱" tone="gold" />
          <PlatformKpi label="Students (all)" value={totalStudents} icon="🎓" tone="violet" />
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#627184] mb-2">
            Quick actions
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            <ActionTile
              href="/onboarding"
              label="Onboard school"
              icon="➕"
              description="Create tenant + first admin"
              primary
            />
            <ActionTile
              href="/platform/domains"
              label="Custom domains"
              icon="🌐"
              description="Map verified domains to schools"
            />
            <ActionTile
              href="/dashboard"
              label="School dashboard"
              icon="📊"
              description="Ops for active tenant"
            />
            <ActionTile
              href="/platform#isolation"
              label="Isolation probe"
              icon="🔒"
              description="Cross-tenant safety check"
            />
          </div>
        </div>

        {session.role === "PLATFORM_ADMIN" && (
          <div className="rounded-xl border border-sky-200/80 bg-gradient-to-br from-sky-50/90 to-white px-4 py-3 text-sm shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-2 min-w-0">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sm"
                aria-hidden
              >
                🎯
              </span>
              <p className="text-ink/70">
                Working as:{" "}
                <strong className="text-navy">
                  {activeSchool?.name ?? "Kayvlop Magnificent School"}
                </strong>
                <span className="text-ink/40 font-mono text-xs ml-1">
                  ({activeSchool?.slug ?? "kms"})
                </span>
              </p>
            </div>
            <p className="text-[11px] text-sky-800/70">
              Switch tenant with "Work as this school" before Students / Fees.
            </p>
          </div>
        )}

        <section className="ledger-block">
          <div className="flex flex-wrap justify-between gap-2 items-center mb-3">
            <div className="flex items-center gap-2">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy/10 text-sm"
                aria-hidden
              >
                📋
              </span>
              <div>
                <h2 className="font-serif text-lg text-navy">Tenants</h2>
                <p className="text-[11px] text-ink/45 mt-0.5">
                  Sorted A–Z · Billing:{" "}
                  <span className={live ? "text-sage font-medium" : "text-ink/60"}>
                    {live ? "Paystack live" : "Mock / manual"}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="table-wrap -mx-1">
            <table className="ledger text-sm">
              <thead>
                <tr>
                  <th>School</th>
                  <th>Slug</th>
                  <th>Plan</th>
                  <th>Cap</th>
                  <th>Sub status</th>
                  <th>Users</th>
                  <th>Students</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {schools.map((s) => {
                  const st = s.subscriptionStatus || "NONE";
                  const expired = isTrialExpired(st, s.planRenewsAt);
                  return (
                    <tr key={s.id}>
                      <td>
                        <span className="font-medium text-ink">{s.name}</span>
                        <span className="block text-[10px] uppercase tracking-wide text-ink/40">
                          {s.shortName}
                        </span>
                      </td>
                      <td className="font-mono text-xs text-ink/60">{s.slug}</td>
                      <td>
                        <span className="status-pill text-navy border-navy/25 bg-navy/5">
                          {s.plan}
                        </span>
                      </td>
                      <td className="tabular-nums">{s.maxStudents}</td>
                      <td>
                        <span className={subPillClass(st, expired)}>{st}</span>
                        {st === "TRIAL" && s.planRenewsAt ? (
                          <span className="block text-[10px] text-ink/45 mt-0.5">
                            {expired ? "Ended " : "Ends "}
                            {formatDate(s.planRenewsAt)}
                          </span>
                        ) : null}
                      </td>
                      <td className="tabular-nums">{s._count.users}</td>
                      <td className="tabular-nums">{s._count.students}</td>
                      <td>
                        <span
                          className={
                            s.isActive
                              ? "status-pill text-sage border-sage/40 bg-sage/5"
                              : "status-pill text-brick border-brick/40 bg-brick/5"
                          }
                        >
                          {s.isActive ? "Active" : "Suspended"}
                        </span>
                        {s.isDemo ? (
                          <span className="block text-[10px] text-ink/40 mt-0.5">Demo</span>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap">
                        {session.role === "PLATFORM_ADMIN" && (
                          <WorkAsSchoolButton schoolId={s.id} />
                        )}
                      </td>
                    </tr>
                  );
                })}
                {schools.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center text-ink/50 py-10">
                      No schools yet. Use <strong>Onboard school</strong>.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div id="isolation">
          {session.role === "PLATFORM_ADMIN" && <IsolationProbeCard />}
        </div>

        <PlatformTrialForm
          schools={schools.map((s) => ({
            id: s.id,
            name: s.name,
            slug: s.slug,
            plan: s.plan,
            subscriptionStatus: s.subscriptionStatus || "NONE",
            planRenewsAt: s.planRenewsAt ? s.planRenewsAt.toISOString() : null,
          }))}
        />

        <PlatformBillingForm
          schools={schools.map((s) => ({
            id: s.id,
            name: s.name,
            slug: s.slug,
            plan: s.plan,
            maxStudents: s.maxStudents,
          }))}
        />

        <section className="ledger-block text-sm space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-sm"
              aria-hidden
            >
              💳
            </span>
            <h2 className="font-serif text-lg text-navy">Billing setup</h2>
          </div>
          <ol className="list-decimal pl-5 space-y-1.5 text-ink/70 text-xs leading-relaxed">
            <li>Create 3 Plans in Paystack (STARTER / PRO / ENTERPRISE).</li>
            <li>
              Env: <code className="text-[10px] bg-paper px-1 rounded">PAYSTACK_SECRET_KEY</code>,{" "}
              <code className="text-[10px] bg-paper px-1 rounded">PAYSTACK_PLAN_*</code>,{" "}
              <code className="text-[10px] bg-paper px-1 rounded">NEXT_PUBLIC_APP_URL</code>
            </li>
            <li>
              Webhook:{" "}
              <code className="text-[10px] bg-paper px-1 rounded">/api/webhooks/paystack</code>
            </li>
            <li>
              Caps: STARTER {PLAN_LIMITS.STARTER} · PRO {PLAN_LIMITS.PRO} · ENTERPRISE{" "}
              {PLAN_LIMITS.ENTERPRISE}
            </li>
          </ol>
        </section>
      </div>
    </PortalShell>
  );
}
