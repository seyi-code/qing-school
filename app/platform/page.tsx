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

export const dynamic = "force-dynamic";

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
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { users: true, students: true } } },
  });

  const live = isSubscriptionLive();
  const activeId = await getActiveSchoolIdFromCookie();
  const activeSchool = activeId
    ? schools.find((s) => s.id === activeId)
    : defaultSchool;

  return (
    <PortalShell
      role={session.role}
      title="Platform · Schools & Billing"
      subtitle="SaaS control plane — all tenants"
      actions={
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href="/onboarding" className="border border-navy text-navy px-3 py-1.5">
            Onboard school
          </Link>
          <Link href="/dashboard" className="border border-navy text-navy px-3 py-1.5">
            School dashboard
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {session.role === "PLATFORM_ADMIN" && (
          <p className="text-sm text-ink/60 ledger-block">
            Working as:{" "}
            <strong className="text-navy">
              {activeSchool?.name ?? "Kayvlop Magnificent School"}
            </strong>
            <span className="text-ink/40">
              {" "}({activeSchool?.slug ?? "kms"}). Use &quot;Work as this school&quot; before Students / Fees.
            </span>
          </p>
        )}

        <section className="ledger-block">
          <div className="flex flex-wrap justify-between gap-2 items-center">
            <h2 className="font-serif text-lg">Tenants</h2>
            <p className="text-xs text-ink/45">
              Billing: {live ? "Paystack live" : "Mock / manual"}
            </p>
          </div>
          <table className="ledger mt-3 text-sm">
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
              {schools.map((s) => (
                <tr key={s.id}>
                  <td>
                    <span className="font-medium">{s.name}</span>
                    <span className="block text-xs text-ink/40">{s.shortName}</span>
                  </td>
                  <td className="font-mono text-xs">{s.slug}</td>
                  <td>{s.plan}</td>
                  <td>{s.maxStudents}</td>
                  <td className="text-xs">
                    <span
                      className={
                        isTrialExpired(s.subscriptionStatus, s.planRenewsAt)
                          ? "text-brick font-medium"
                          : ""
                      }
                    >
                      {s.subscriptionStatus || "NONE"}
                    </span>
                    {s.subscriptionStatus === "TRIAL" && s.planRenewsAt ? (
                      <span className="block text-[10px] text-ink/45">
                        {isTrialExpired(s.subscriptionStatus, s.planRenewsAt)
                          ? "Ended "
                          : "Ends "}
                        {formatDate(s.planRenewsAt)}
                      </span>
                    ) : null}
                  </td>
                  <td>{s._count.users}</td>
                  <td>{s._count.students}</td>
                  <td className={s.isActive ? "text-sage" : "text-brick"}>
                    {s.isActive ? "Active" : "Suspended"}
                    {s.isDemo ? " · Demo" : ""}
                  </td>
                  <td>
                    {session.role === "PLATFORM_ADMIN" && (
                      <WorkAsSchoolButton schoolId={s.id} />
                    )}
                  </td>
                </tr>
              ))}
              {schools.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center text-ink/50 py-8">
                    No schools yet. Use Onboard school.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {session.role === "PLATFORM_ADMIN" && <IsolationProbeCard />}

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
          }))}
        />

        <section className="ledger-block text-sm space-y-2">
          <h2 className="font-serif text-lg">Billing setup (your side)</h2>
          <ol className="list-decimal pl-5 space-y-1 text-ink/70">
            <li>Create 3 Plans in Paystack (STARTER / PRO / ENTERPRISE).</li>
            <li>Env: PAYSTACK_SECRET_KEY, PAYSTACK_PLAN_*, NEXT_PUBLIC_APP_URL, TERMII_*.</li>
            <li>
              Webhook: <code className="text-xs">/api/webhooks/paystack</code>
            </li>
            <li>
              Caps: STARTER {PLAN_LIMITS.STARTER}, PRO {PLAN_LIMITS.PRO}, ENTERPRISE{" "}
              {PLAN_LIMITS.ENTERPRISE}.
            </li>
          </ol>
        </section>
      </div>
    </PortalShell>
  );
}
