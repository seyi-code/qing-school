import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { PortalShell } from "@/components/PortalShell";
import { ClassManager } from "./ClassManager";
import { can, homeRouteForRole } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { resolveSchoolId, schoolWhere } from "@/lib/tenant-scope";
import { Kpi } from "@/components/ui/Kpi";

export const dynamic = "force-dynamic";

export default async function ClassesPage() {
  const session = await requireSession();
  if (!can(session.role, "MANAGE_CLASSES")) redirect(homeRouteForRole(session.role));

  const schoolId = await resolveSchoolId(session);

  const [classes, subjects, teachers] = await Promise.all([
    prisma.schoolClass.findMany({
      where: schoolWhere(schoolId),
      include: { arms: { include: { students: { where: { status: "ACTIVE" } } } } },
      orderBy: { order: "asc" },
    }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.staff.findMany({
      where: {
        isActive: true,
        ...(schoolId ? { schoolId } : {}),
        OR: [{ category: "TEACHING" }, { user: { role: "TEACHER" } }],
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
  ]);

  const teacherOptions = teachers.map((s) => ({
    id: s.id,
    label: `${s.lastName}, ${s.firstName}`,
  }));

  return (
    <PortalShell
      role={session.role}
      title="Classes & Subjects"
      subtitle="Manage class structure and promote students"
      email={session.email}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
        <Kpi label="Classes" value={String(classes.length)} tone="navy" icon="🏫" />
        <Kpi label="Subjects" value={String(subjects.length)} tone="violet" icon="📚" />
        <Kpi
          label="Arms"
          value={String(classes.reduce((n, c) => n + c.arms.length, 0))}
          tone="sage"
          icon="#"
          className="col-span-2 sm:col-span-1"
        />
      </div>
      <div className="mb-4 rounded-xl border border-sky-200/80 bg-gradient-to-br from-sky-50 to-white px-3.5 py-3 text-sm text-sky-900/80 shadow-sm">
        Create classes → arms → subjects, then <strong>Assign subject to arm</strong> and pick a{" "}
        <strong>teacher</strong>. Optional: “Also set as class teacher”. That fills the teacher portal
        and timetable teacher for conflicts.
      </div>
      <ClassManager
        classes={classes.map((c) => ({
          id: c.id,
          name: c.name,
          arms: c.arms.map((a) => ({
            id: a.id,
            name: a.name,
            studentCount: a.students.length,
          })),
        }))}
        subjects={subjects.map((s) => ({
          id: s.id,
          name: s.name,
        }))}
        teachers={teacherOptions}
      />
    </PortalShell>
  );
}
