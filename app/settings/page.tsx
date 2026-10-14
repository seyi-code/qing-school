import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { PortalShell } from "@/components/PortalShell";
import { can, homeRouteForRole } from "@/lib/permissions";
import { resolveSchoolId, schoolWhere } from "@/lib/tenant-scope";
import { formatDateTime } from "@/lib/format";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Kpi } from "@/components/ui/Kpi";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireSession();
  if (!can(session.role, "MANAGE_SYSTEM_SETTINGS")) {
    redirect(homeRouteForRole(session.role));
  }

  const schoolId = await resolveSchoolId(session);

  const [sessions, bands, audit] = await Promise.all([
    prisma.session.findMany({
      where: schoolWhere(schoolId),
      include: { terms: true },
      orderBy: { name: "desc" },
    }),
    prisma.gradeBand.findMany({ orderBy: { minScore: "desc" } }),
    can(session.role, "VIEW_AUDIT_TRAIL")
      ? prisma.auditLog.findMany({
          where: schoolWhere(schoolId),
          orderBy: { createdAt: "desc" },
          take: 30,
          include: { user: { select: { email: true } } },
        })
      : Promise.resolve(
          [] as {
            id: string;
            createdAt: Date;
            action: string;
            entity: string;
            user: { email: string } | null;
          }[]
        ),
  ]);

  return (
    <PortalShell
      role={session.role}
      title="Admin Settings"
      subtitle="Academic year, grade bands, system"
      email={session.email}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
        <Kpi label="Sessions" value={String(sessions.length)} tone="navy" icon="📅" />
        <Kpi label="Grade bands" value={String(bands.length)} tone="violet" icon="📊" />
        <Kpi
          label="Audit rows"
          value={String(audit.length)}
          tone="sky"
          icon="📋"
          className="col-span-2 sm:col-span-1"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <section className="ledger-block">
          <h2 className="font-serif text-lg mb-3">Academic sessions</h2>
          {sessions.length === 0 && (
            <p className="text-sm text-ink/50">No sessions for this school yet.</p>
          )}
          <ul className="text-sm space-y-3">
            {sessions.map((s) => (
              <li key={s.id} className="border-b border-line pb-2">
                <p className="font-medium">
                  {s.name} {s.isCurrent ? <span className="text-sage text-xs">(current)</span> : null}
                </p>
                <ul className="text-xs text-ink/60 mt-1">
                  {s.terms.map((t) => (
                    <li key={t.id}>
                      {t.name}
                      {t.isCurrent ? " · current term" : ""}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <p className="text-xs text-ink/40 mt-3">
            Manage sessions under Ops / seed tools if needed.
          </p>
        </section>

        <section className="ledger-block">
          <h2 className="font-serif text-lg mb-3">Grade bands</h2>
          {bands.length === 0 ? (
            <p className="text-sm text-ink/50">No grade bands configured.</p>
          ) : (
            <table className="ledger text-sm">
              <thead>
                <tr>
                  <th>Range</th>
                  <th>Grade</th>
                  <th>Remark</th>
                </tr>
              </thead>
              <tbody>
                {bands.map((b) => (
                  <tr key={b.id}>
                    <td className="tabular-nums">
                      {b.minScore}–{b.maxScore}
                    </td>
                    <td className="font-medium">{b.grade}</td>
                    <td className="text-ink/60">{b.remark || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="ledger-block lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2 className="font-serif text-lg">Recent audit</h2>
            {can(session.role, "VIEW_AUDIT_TRAIL") && (
              <Link href="/settings/audit" className="text-sm text-navy font-medium hover:underline">
                Full trail
              </Link>
            )}
          </div>
          {audit.length === 0 ? (
            <p className="text-sm text-ink/50">No recent actions for this school.</p>
          ) : (
            <ul className="text-sm space-y-2">
              {audit.map((a) => (
                <li key={a.id} className="border-b border-line/70 pb-2">
                  <span className="text-ink/50 text-xs">{formatDateTime(a.createdAt)}</span>{" "}
                  <span className="font-medium">{a.action}</span> {a.entity}
                  <span className="block text-xs text-ink/50">{a.user?.email ?? "—"}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/settings/ops" className="btn-ghost text-sm">
              Operations / SMS / backup
            </Link>
          </div>
        </section>
      </div>
    </PortalShell>
  );
}
