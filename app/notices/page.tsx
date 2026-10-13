import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { PortalShell } from "@/components/PortalShell";
import { can, homeRouteForRole } from "@/lib/permissions";
import { resolveSchoolId, schoolWhere } from "@/lib/tenant-scope";
import { formatDate } from "@/lib/format";
import { redirect } from "next/navigation";
import { NoticeForm } from "./NoticeForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { SCHOOL } from "@/lib/school";

export const dynamic = "force-dynamic";

async function scrubLegacyBranding() {
  const stale = await prisma.notice.findMany({
    where: {
      OR: [
        { title: { contains: "Qing" } },
        { body: { contains: "Qing" } },
        { title: { contains: "qing-school" } },
        { body: { contains: "qing-school" } },
      ],
    },
    take: 20,
  });
  for (const n of stale) {
    await prisma.notice.update({
      where: { id: n.id },
      data: {
        title: n.title.replace(/\bQing School\b/gi, SCHOOL.name).replace(/\bQing\b/gi, SCHOOL.shortName),
        body: n.body
          .replace(/\bQing School\b/gi, SCHOOL.name)
          .replace(/\bQing\b/gi, SCHOOL.shortName),
      },
    });
  }
}

export default async function NoticesPage() {
  const session = await requireSession();
  if (!can(session.role, "MANAGE_NOTICES")) redirect(homeRouteForRole(session.role));

  await scrubLegacyBranding();

  const schoolId = await resolveSchoolId(session);
  const [notices, complaints] = await Promise.all([
    prisma.notice.findMany({
      where: { NOT: { audience: "COMPLAINT" }, ...schoolWhere(schoolId) },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.notice.findMany({
      where: { audience: "COMPLAINT", ...schoolWhere(schoolId) },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <PortalShell role={session.role} title="Communication" subtitle="Notices and public complaints" email={session.email}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 mb-6">
        <section className="ledger-block">
          <h2 className="font-serif text-lg text-navy mb-3">Post a notice</h2>
          <NoticeForm />
        </section>
        <section className="ledger-block lg:col-span-2">
          <h2 className="font-serif text-lg text-navy mb-3">Recent notices</h2>
          {notices.length === 0 ? (
            <EmptyState
              title="No notices yet"
              description="Post announcements for parents, staff, or the public website."
            />
          ) : (
            <ul className="space-y-3">
              {notices.map((n) => (
                <li key={n.id} className="rounded-xl border border-line/80 bg-white/80 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-medium text-sm text-navy">{n.title}</p>
                    <span className="status-pill text-[10px]">{n.audience}{n.publishToWeb ? " · web" : ""}</span>
                  </div>
                  <p className="text-xs text-ink/50 mt-0.5">{formatDate(n.createdAt)}</p>
                  <p className="text-sm text-ink/70 mt-1.5 whitespace-pre-wrap">{n.body}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="ledger-block">
        <h2 className="font-serif text-lg text-navy mb-3">Public complaints / feedback</h2>
        {complaints.length === 0 ? (
          <EmptyState
            title="No complaints"
            description="Items submitted from the public site appear here."
          />
        ) : (
          <ul className="space-y-3">
            {complaints.map((n) => (
              <li key={n.id} className="rounded-xl border border-line/80 bg-white/80 p-3">
                <p className="font-medium text-sm text-navy">{n.title}</p>
                <p className="text-xs text-ink/50">{formatDate(n.createdAt)}</p>
                <p className="text-sm text-ink/70 mt-1 whitespace-pre-wrap">{n.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PortalShell>
  );
}
