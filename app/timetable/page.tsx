import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { PortalShell } from "@/components/PortalShell";
import { can, homeRouteForRole } from "@/lib/permissions";
import { resolveSchoolId } from "@/lib/tenant-scope";
import { redirect } from "next/navigation";
import { TimetableEditor } from "./TimetableEditor";

export const dynamic = "force-dynamic";

export default async function TimetablePage({
  searchParams,
}: {
  searchParams: { armId?: string };
}) {
  const session = await requireSession();
  const allowed = ["ADMIN", "IT", "TEACHER", "PRINCIPAL", "PLATFORM_ADMIN"];
  if (!allowed.includes(session.role)) redirect(homeRouteForRole(session.role));

  const schoolId = await resolveSchoolId(session);

  const arms = await prisma.arm.findMany({
    where: schoolId ? { schoolClass: { schoolId } } : undefined,
    include: {
      schoolClass: true,
      subjects: { include: { subject: true } },
    },
    orderBy: [{ schoolClass: { order: "asc" } }, { name: "asc" }],
  });

  const requested = searchParams.armId;
  const armId =
    (requested && arms.some((a) => a.id === requested) ? requested : null) || arms[0]?.id;
  const selected = arms.find((a) => a.id === armId) || arms[0];

  const slots = selected
    ? await prisma.timetableSlot.findMany({
        where: { armId: selected.id },
        include: { armSubject: { include: { subject: true } } },
      })
    : [];

  const canEdit = can(session.role, "MANAGE_CLASSES");

  return (
    <PortalShell
      role={session.role}
      title="Timetable"
      subtitle="Weekly class periods (Mon–Fri)"
      email={session.email}
    >
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <div className="rounded-xl border border-blue-200/90 bg-gradient-to-br from-blue-50 to-white px-3.5 py-3 shadow-sm">
          <p className="text-[10px] uppercase tracking-wide font-medium text-blue-700/70">Arms</p>
          <p className="mt-1 text-xl font-semibold text-blue-900 tabular-nums">{arms.length}</p>
        </div>
        <div className="rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50 to-white px-3.5 py-3 shadow-sm">
          <p className="text-[10px] uppercase tracking-wide font-medium text-amber-800/70">Slots saved</p>
          <p className="mt-1 text-xl font-semibold text-amber-900 tabular-nums">{selected ? slots.length : 0}</p>
        </div>
      </div>
      <p className="mb-4 text-sm text-sky-900/80 rounded-xl border border-sky-200/80 bg-gradient-to-br from-sky-50 to-white px-3.5 py-3 shadow-sm">
        Conflict check: assigning a subject whose teacher is already teaching another class at the same day/period will warn you before saving.
      </p>
      {!selected ? (
        <p className="text-ink/50 text-sm rounded-xl border border-line bg-white px-4 py-6 text-center">
          Create a class and arm under Classes first.
        </p>
      ) : (
        <TimetableEditor
          arms={arms.map((a) => ({
            id: a.id,
            label: `${a.schoolClass.name} ${a.name}`,
            subjects: a.subjects.map((s) => ({
              armSubjectId: s.id,
              name: s.subject.name,
            })),
          }))}
          selectedArmId={selected.id}
          slots={slots.map((s) => ({
            id: s.id,
            dayOfWeek: s.dayOfWeek,
            period: s.period,
            armSubjectId: s.armSubjectId,
            subjectName: s.armSubject.subject.name,
          }))}
          canEdit={canEdit}
        />
      )}
    </PortalShell>
  );
}
