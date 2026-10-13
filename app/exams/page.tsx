import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { PortalShell } from "@/components/PortalShell";
import { ScoreEntryGrid } from "./ScoreEntryGrid";
import { redirect } from "next/navigation";
import { homeRouteForRole } from "@/lib/permissions";
import { resolveSchoolId } from "@/lib/tenant-scope";

const ALLOWED_ROLES = ["ADMIN", "TEACHER", "PRINCIPAL", "PLATFORM_ADMIN", "IT"];

export const dynamic = "force-dynamic";

export default async function ExamsPage({
  searchParams,
}: {
  searchParams: { armSubjectId?: string };
}) {
  const session = await requireSession();
  if (!ALLOWED_ROLES.includes(session.role)) redirect(homeRouteForRole(session.role));

  const schoolId = await resolveSchoolId(session);

  const term = await prisma.term.findFirst({
    where: {
      isCurrent: true,
      ...(schoolId ? { session: { schoolId } } : {}),
    },
  });

  const armSubjects = await prisma.armSubject.findMany({
    where: schoolId ? { arm: { schoolClass: { schoolId } } } : undefined,
    include: { arm: { include: { schoolClass: true } }, subject: true },
    orderBy: [{ arm: { schoolClass: { order: "asc" } } }],
  });

  const requested = searchParams.armSubjectId;
  const selected =
    (requested ? armSubjects.find((a) => a.id === requested) : null) ?? armSubjects[0];

  const students = selected
    ? await prisma.student.findMany({
        where: {
          armId: selected.armId,
          status: "ACTIVE",
          ...(schoolId ? { schoolId } : {}),
        },
        orderBy: [{ lastName: "asc" }],
      })
    : [];

  const existingScores =
    selected && term
      ? await prisma.score.findMany({
          where: { armSubjectId: selected.id, termId: term.id },
        })
      : [];
  const scoreByStudent = Object.fromEntries(existingScores.map((s) => [s.studentId, s]));

  return (
    <PortalShell
      role={session.role}
      title="Exams & Results"
      subtitle={term ? `Entering scores for ${term.name}` : "No current term set"}
      email={session.email}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
        <div className="rounded-xl border border-blue-200/90 bg-gradient-to-br from-blue-50 to-white px-3.5 py-3 shadow-sm">
          <p className="text-[10px] uppercase tracking-wide font-medium text-blue-700/70">Subjects</p>
          <p className="mt-1 text-xl font-semibold text-blue-900 tabular-nums">{armSubjects.length}</p>
        </div>
        <div className="rounded-xl border border-violet-200/90 bg-gradient-to-br from-violet-50 to-white px-3.5 py-3 shadow-sm">
          <p className="text-[10px] uppercase tracking-wide font-medium text-violet-700/70">Students in view</p>
          <p className="mt-1 text-xl font-semibold text-violet-900 tabular-nums">{students.length}</p>
        </div>
        <div className="rounded-xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50 to-white px-3.5 py-3 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-[10px] uppercase tracking-wide font-medium text-emerald-700/70">Scores entered</p>
          <p className="mt-1 text-xl font-semibold text-emerald-800 tabular-nums">{existingScores.length}</p>
        </div>
      </div>
      <form method="GET" className="mb-4 rounded-xl border border-sky-200/80 bg-gradient-to-br from-sky-50 to-white p-3 shadow-sm flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[12rem]">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-ink/50">Class · subject</label>
          <select
            name="armSubjectId"
            defaultValue={selected?.id}
            className="mt-1 block w-full rounded-xl border border-line px-3 py-2.5 text-sm bg-white"
          >
            {armSubjects.length === 0 && <option value="">No subjects assigned</option>}
            {armSubjects.map((a) => (
              <option key={a.id} value={a.id}>
                {a.arm.schoolClass.name} {a.arm.name} — {a.subject.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-ghost text-sm">
          Load
        </button>
      </form>

      {selected && term ? (
        students.length === 0 ? (
          <p className="text-sm text-ink/60 rounded-xl border border-line bg-white px-4 py-6 text-center">
            No active students in this class for this school.
          </p>
        ) : (
          <ScoreEntryGrid
            armSubjectId={selected.id}
            termId={term.id}
            students={students.map((s) => ({
              id: s.id,
              name: `${s.lastName}, ${s.firstName}`,
              ca1: scoreByStudent[s.id]?.ca1 ?? 0,
              ca2: scoreByStudent[s.id]?.ca2 ?? 0,
              exam: scoreByStudent[s.id]?.exam ?? 0,
            }))}
          />
        )
      ) : (
        <p className="text-ink/50 rounded-xl border border-line bg-white px-4 py-6 text-center text-sm">
          {term
            ? "No subjects assigned to classes yet. Assign subjects under Classes."
            : "Set a current term for this school under Settings / academic year."}
        </p>
      )}
    </PortalShell>
  );
}
