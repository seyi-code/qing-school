import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { PortalShell } from "@/components/PortalShell";
import { ClassManager } from "./ClassManager";
import { can, homeRouteForRole } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { resolveSchoolId, schoolWhere } from "@/lib/tenant-scope";

export const dynamic = "force-dynamic";

export default async function ClassesPage() {
  const session = await requireSession();
  if (!can(session.role, "MANAGE_CLASSES")) redirect(homeRouteForRole(session.role));

  const schoolId = await resolveSchoolId(session);

  const [classes, subjects] = await Promise.all([
    prisma.schoolClass.findMany({
      where: schoolWhere(schoolId),
      include: { arms: { include: { students: { where: { status: "ACTIVE" } } } } },
      orderBy: { order: "asc" },
    }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <PortalShell
      role={session.role}
      title="Classes & Subjects"
      subtitle="Manage class structure and promote students"
      email={session.email}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
        <div className="rounded-xl border border-blue-200/90 bg-gradient-to-br from-blue-50 to-white px-3.5 py-3 shadow-sm">
          <p className="text-[10px] uppercase tracking-wide font-medium text-blue-700/70">Classes</p>
          <p className="mt-1 text-xl font-semibold text-blue-900 tabular-nums">{classes.length}</p>
        </div>
        <div className="rounded-xl border border-violet-200/90 bg-gradient-to-br from-violet-50 to-white px-3.5 py-3 shadow-sm">
          <p className="text-[10px] uppercase tracking-wide font-medium text-violet-700/70">Subjects</p>
          <p className="mt-1 text-xl font-semibold text-violet-900 tabular-nums">{subjects.length}</p>
        </div>
        <div className="rounded-xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50 to-white px-3.5 py-3 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-[10px] uppercase tracking-wide font-medium text-emerald-700/70">Arms</p>
          <p className="mt-1 text-xl font-semibold text-emerald-800 tabular-nums">
            {classes.reduce((n, c) => n + c.arms.length, 0)}
          </p>
        </div>
      </div>
      <div className="mb-4 rounded-xl border border-sky-200/80 bg-gradient-to-br from-sky-50 to-white px-3.5 py-3 text-sm text-sky-900/80 shadow-sm">
        Create classes and arms first, add subjects, then assign subjects to arms so teachers can enter scores.
      </div>
      <ClassManager
        classes={classes.map((c) => ({
          id: c.id,
          name: c.name,
          order: c.order,
          arms: c.arms.map((a) => ({
            id: a.id,
            name: a.name,
            studentCount: a.students.length,
          })),
        }))}
        subjects={subjects.map((s) => ({
          id: s.id,
          name: s.name,
          code: s.code,
        }))}
      />
    </PortalShell>
  );
}
