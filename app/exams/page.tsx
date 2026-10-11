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
      <form method="GET" className="mb-4">
        <select
          name="armSubjectId"
          defaultValue={selected?.id}
          className="border border-line px-3 py-2 text-sm bg-white"
          onChange={undefined}
        >
          {armSubjects.length === 0 && <option value="">No subjects assigned</option>}
          {armSubjects.map((a) => (
            <option key={a.id} value={a.id}>
              {a.arm.schoolClass.name} {a.arm.name} — {a.subject.name}
            </option>
          ))}
        </select>
      </form>

      {selected && term ? (
        students.length === 0 ? (
          <p className="text-sm text-ink/60 ledger-block">
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
        <p className="text-ink/50">
          {term
            ? "No subjects assigned to classes yet. Assign subjects under Classes."
            : "Set a current term for this school under Settings / academic year."}
        </p>
      )}
    </PortalShell>
  );
}
