import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { PortalShell } from "@/components/PortalShell";
import { can, homeRouteForRole } from "@/lib/permissions";
import { resolveSchoolId, schoolWhere } from "@/lib/tenant-scope";
import { redirect } from "next/navigation";
import { SCHOOL } from "@/lib/school-config";
import { Kpi } from "@/components/ui/Kpi";
import { NoticesBoard } from "./NoticesBoard";
import { ComplaintsBoard } from "./ComplaintsBoard";

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

  const openCount = complaints.filter((c) => (c.status || "OPEN") === "OPEN").length;

  return (
    <PortalShell
      role={session.role}
      title="Communication"
      subtitle="Notices and public complaints"
      email={session.email}
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
        <Kpi label="Notices" value={String(notices.length)} tone="navy" icon="📢" />
        <Kpi label="Complaints" value={String(complaints.length)} tone="gold" icon="!" />
        <Kpi label="Open tickets" value={String(openCount)} tone={openCount ? "gold" : "sage"} icon="…" />
        <Kpi
          label="On web"
          value={String(notices.filter((n) => n.publishToWeb).length)}
          tone="sage"
          icon="🌐"
        />
      </div>

      <NoticesBoard
        notices={notices.map((n) => ({
          id: n.id,
          title: n.title,
          body: n.body,
          audience: n.audience,
          publishToWeb: n.publishToWeb,
          createdAt: n.createdAt,
        }))}
      />

      <section className="rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/80 to-white p-4 sm:p-5 shadow-sm">
        <h2 className="font-serif text-lg text-navy mb-3">Public complaints / feedback</h2>
        <ComplaintsBoard
          complaints={complaints.map((c) => ({
            id: c.id,
            title: c.title,
            body: c.body,
            status: c.status || "OPEN",
            internalNote: c.internalNote ?? null,
            contactName: c.contactName ?? null,
            contactValue: c.contactValue ?? null,
            createdAt: c.createdAt,
          }))}
        />
      </section>
    </PortalShell>
  );
}
