import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { PortalShell } from "@/components/PortalShell";
import { resolveSchoolId } from "@/lib/tenant-scope";
import { notFound, redirect } from "next/navigation";
import { TakeExamClient } from "./TakeExamClient";

export const dynamic = "force-dynamic";

export default async function TakeExamPage({ params }: { params: { id: string } }) {
  const session = await requireSession();
  const schoolId = await resolveSchoolId(session);

  const exam = await prisma.cbtExam.findUnique({
    where: { id: params.id },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!exam) notFound();

  if (schoolId && exam.schoolId && exam.schoolId !== schoolId) {
    notFound();
  }

  if (session.role === "STUDENT") {
    if (!exam.isOpen) {
      return (
        <PortalShell role={session.role} title={exam.title}>
          <p className="text-sm text-ink/60">This test is closed.</p>
        </PortalShell>
      );
    }
    const student = await prisma.student.findFirst({
      where: { userId: session.userId },
    });
    if (!student) redirect("/portal/student");
    if (schoolId && student.schoolId && student.schoolId !== schoolId) {
      notFound();
    }
    const prior = await prisma.cbtAttempt.findFirst({
      where: { examId: exam.id, studentId: student.id },
    });
    if (prior) {
      return (
        <PortalShell role={session.role} title={exam.title}>
          <p className="text-sm">
            Already submitted: {prior.score}/{prior.total} ({prior.percent}%)
            {prior.needsGrading ? " — essays pending grade" : ""}
          </p>
        </PortalShell>
      );
    }
  } else if (!["ADMIN", "IT", "TEACHER", "PRINCIPAL", "PLATFORM_ADMIN"].includes(session.role)) {
    redirect("/dashboard");
  }

  return (
    <PortalShell
      role={session.role}
      title={exam.title}
      subtitle={`${exam.durationMinutes} minutes`}
      email={session.email}
    >
      <TakeExamClient
        examId={exam.id}
        durationMinutes={exam.durationMinutes}
        canSubmit={session.role === "STUDENT"}
        proctoring={exam.proctoring}
        negativeMark={exam.negativeMark}
        questions={exam.questions.map((q) => ({
          id: q.id,
          prompt: q.prompt,
          type: q.type,
          marks: q.marks,
          options: q.optionsJson ? (JSON.parse(q.optionsJson) as string[]) : [],
        }))}
      />
    </PortalShell>
  );
}
