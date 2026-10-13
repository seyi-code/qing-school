import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { PortalShell } from "@/components/PortalShell";
import { homeRouteForRole } from "@/lib/permissions";
import { resolveSchoolId, schoolWhere } from "@/lib/tenant-scope";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CbtStaffPanel } from "./CbtStaffPanel";

export const dynamic = "force-dynamic";

export default async function CbtPage() {
  const session = await requireSession();
  const schoolId = await resolveSchoolId(session);

  if (session.role === "STUDENT") {
    const student = await prisma.student.findFirst({
      where: { userId: session.userId },
    });
    const exams = await prisma.cbtExam.findMany({
      where: { isOpen: true, ...schoolWhere(schoolId) },
      orderBy: { createdAt: "desc" },
    });
    const attempts = student
      ? await prisma.cbtAttempt.findMany({
          where: { studentId: student.id },
          orderBy: { submittedAt: "desc" },
          take: 20,
        })
      : [];
    const attempted = new Set(attempts.map((a) => a.examId));

    return (
      <PortalShell role={session.role} title="CBT / Tests" subtitle="Open computer-based tests" email={session.email}>
        <ul className="space-y-3">
          {exams.map((e) => (
            <li
              key={e.id}
              className="rounded-xl border border-sky-200/80 bg-gradient-to-br from-sky-50 to-white p-4 shadow-sm flex flex-wrap justify-between gap-2 items-center"
            >
              <div>
                <p className="font-medium">{e.title}</p>
                <p className="text-xs text-ink/50">{e.durationMinutes} minutes</p>
              </div>
              {attempted.has(e.id) ? (
                <span className="text-sm text-sage">Submitted</span>
              ) : (
                <Link href={`/cbt/${e.id}/take`} className="btn-primary text-sm">
                  Start test
                </Link>
              )}
            </li>
          ))}
          {exams.length === 0 && <p className="text-sm text-ink/50">No open tests right now.</p>}
        </ul>
        {attempts.length > 0 && (
          <section className="rounded-xl border border-violet-200/70 bg-gradient-to-br from-violet-50/50 to-white p-4 mt-6 shadow-sm">
            <h2 className="font-serif text-lg text-navy mb-2">Your results</h2>
            <ul className="text-sm space-y-1">
              {attempts.map((a) => (
                <li key={a.id} className="flex justify-between border-b border-line py-1.5">
                  <span className="text-ink/60">{a.submittedAt.toLocaleString()}</span>
                  <span className="font-medium tabular-nums">
                    {a.score}/{a.total} ({a.percent}%)
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </PortalShell>
    );
  }

  if (!["ADMIN", "IT", "TEACHER", "PRINCIPAL", "PLATFORM_ADMIN"].includes(session.role)) {
    redirect(homeRouteForRole(session.role));
  }

  const exams = await prisma.cbtExam.findMany({
    where: schoolWhere(schoolId),
    include: { _count: { select: { questions: true, attempts: true } } },
    orderBy: { createdAt: "desc" },
  });

  const pendingGrading = await prisma.cbtAttempt.count({
    where: {
      needsGrading: true,
      ...(schoolId ? { student: { schoolId } } : {}),
    },
  });

  return (
    <PortalShell role={session.role} title="CBT" subtitle="Create MCQ tests for students" email={session.email}>
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/cbt/results" className="btn-ghost text-sm">
          Results & essay grading
          {pendingGrading > 0 ? ` (${pendingGrading} pending)` : ""}
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <div className="rounded-xl border border-blue-200/90 bg-gradient-to-br from-blue-50 to-white px-3.5 py-3 shadow-sm">
          <p className="text-[10px] uppercase tracking-wide font-medium text-blue-700/70">Exams</p>
          <p className="mt-1 text-xl font-semibold text-blue-900 tabular-nums">{exams.length}</p>
        </div>
        <div className="rounded-xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50 to-white px-3.5 py-3 shadow-sm">
          <p className="text-[10px] uppercase tracking-wide font-medium text-emerald-700/70">Questions (all)</p>
          <p className="mt-1 text-xl font-semibold text-emerald-800 tabular-nums">
            {exams.reduce((n, e) => n + e._count.questions, 0)}
          </p>
        </div>
      </div>
      <CbtStaffPanel
        exams={exams.map((e) => ({
          id: e.id,
          title: e.title,
          durationMinutes: e.durationMinutes,
          isOpen: e.isOpen,
          questionCount: e._count.questions,
          attemptCount: e._count.attempts,
        }))}
      />
    </PortalShell>
  );
}
