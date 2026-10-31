import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { PortalShell } from "@/components/PortalShell";
import { StudentDocuments } from "@/components/StudentDocuments";
import { ApproveStudentButton } from "@/components/ApproveStudentButton";
import { StudentEditForm } from "@/components/StudentEditForm";
import { StudentLifecycleActions } from "@/components/StudentLifecycleActions";
import { EnableStudentPortalButton } from "@/components/EnableStudentPortalButton";
import { Card, StatusPill } from "@/components/ui/Card";
import { can } from "@/lib/permissions";
import { formatNaira, formatDate } from "@/lib/format";
import { toMoney } from "@/lib/money";
import { notFound, redirect } from "next/navigation";
import { resolveSchoolId } from "@/lib/tenant-scope";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  const session = await requireSession();
  const schoolId = await resolveSchoolId(session);

  if (session.role === "STUDENT") {
    const owns = await prisma.student.findFirst({
      where: { id: params.id, userId: session.userId },
    });
    if (!owns) redirect("/portal/student");
  }
  if (session.role === "PARENT") {
    const linked = await prisma.parentLink.findFirst({
      where: { studentId: params.id, parentId: session.userId },
    });
    if (!linked) redirect("/portal/parent");
  }

  const [student, arms] = await Promise.all([
    prisma.student.findUnique({
      where: { id: params.id },
      include: {
        arm: { include: { schoolClass: true } },
        invoices: { orderBy: { createdAt: "desc" } },
        scores: { include: { armSubject: { include: { subject: true } } } },
        attendances: { orderBy: { date: "desc" }, take: 10 },
        parentLinks: { include: { parent: { select: { email: true } } } },
        documents: { orderBy: { uploadedAt: "desc" } },
        hostelAllocs: {
          where: { status: "ACTIVE" },
          include: { room: true },
          take: 1,
        },
        transportEnrolls: {
          where: { status: "ACTIVE" },
          include: { route: true },
          take: 1,
        },
      },
    }),
    prisma.arm.findMany({
      where: schoolId ? { schoolClass: { schoolId } } : undefined,
      include: { schoolClass: true },
      orderBy: [{ schoolClass: { order: "asc" } }, { name: "asc" }],
    }),
  ]);

  if (!student) notFound();
  if (schoolId && student.schoolId && student.schoolId !== schoolId) notFound();

  const canManage = can(session.role, "MANAGE_STUDENTS");
  const hostel = student.hostelAllocs[0];
  const transport = student.transportEnrolls[0];
  const classLabel = student.arm
    ? `${student.arm.schoolClass.name} ${student.arm.name}`
    : "Unassigned";

  return (
    <PortalShell
      role={session.role}
      title={`${student.firstName} ${student.lastName}`}
      subtitle={`${student.admissionNumber} · ${classLabel} · ${student.status}`}
      email={session.email}
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            href="/students"
            className="inline-flex items-center rounded-lg border border-line bg-white px-3.5 py-2 text-xs font-medium text-navy hover:bg-navy/5"
          >
            ← Students
          </Link>
          <Link
            href={`/students/${student.id}/report-card`}
            className="inline-flex items-center rounded-lg bg-navy px-3.5 py-2 text-xs font-medium text-paper hover:bg-navy-light"
          >
            Report card
          </Link>
          {student.status === "APPLIED" && canManage ? (
            <ApproveStudentButton studentId={student.id} />
          ) : null}
        </div>
      }
    >
      <nav
        aria-label="On this page"
        className="hidden md:flex flex-wrap gap-2 mb-4 sticky top-[4.5rem] z-20 bg-[#f5f7fa]/95 backdrop-blur-sm py-2 border-b border-line/60"
      >
        {canManage ? (
          <a
            href="#student-edit"
            className="text-xs font-medium px-3 py-1.5 rounded-full border border-line bg-white text-navy hover:bg-navy/5"
          >
            Edit
          </a>
        ) : null}
        <a
          href="#student-overview"
          className="text-xs font-medium px-3 py-1.5 rounded-full border border-line bg-white text-navy hover:bg-navy/5"
        >
          Overview
        </a>
        <a
          href="#student-documents"
          className="text-xs font-medium px-3 py-1.5 rounded-full border border-line bg-white text-navy hover:bg-navy/5"
        >
          Documents
        </a>
        <a
          href="#student-results"
          className="text-xs font-medium px-3 py-1.5 rounded-full border border-line bg-white text-navy hover:bg-navy/5"
        >
          Results
        </a>
      </nav>

      {canManage && (
        <div id="student-edit" className="mb-4 sm:mb-5 space-y-3 max-w-5xl scroll-mt-28">
          <EnableStudentPortalButton
            studentId={student.id}
            hasPortal={Boolean(student.userId)}
          />
          <Card title="Edit student">
            <StudentEditForm
              studentId={student.id}
              arms={arms.map((a) => ({
                id: a.id,
                label: `${a.schoolClass.name} ${a.name}`,
              }))}
              initial={{
                firstName: student.firstName,
                lastName: student.lastName,
                otherNames: student.otherNames ?? "",
                gender: student.gender ?? "",
                address: student.address ?? "",
                previousSchool: student.previousSchool ?? "",
                medicalNotes: student.medicalNotes ?? "",
                guardianPhone: student.guardianPhone ?? "",
                armId: student.armId ?? "",
                status: student.status,
                admissionNumber: student.admissionNumber,
              }}
            />
          </Card>
          <StudentLifecycleActions
            studentId={student.id}
            admissionNumber={student.admissionNumber}
            fullName={`${student.firstName} ${student.lastName}`}
            status={student.status}
            isAdmin={["ADMIN", "IT"].includes(session.role)}
            hasPaidFees={student.invoices.some((inv) => toMoney(inv.amountPaid) > 0)}
          />
        </div>
      )}

      <div
        id="student-overview"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-5 max-w-6xl scroll-mt-28"
      >
        <Card title="Bio data">
          <dl className="text-sm space-y-2">
            <Row label="Class / Arm" value={classLabel} />
            <Row label="Gender" value={student.gender ?? "—"} />
            <Row
              label="Date of birth"
              value={student.dateOfBirth ? formatDate(student.dateOfBirth) : "—"}
            />
            <Row label="Address" value={student.address ?? "—"} />
            <Row label="Previous school" value={student.previousSchool ?? "—"} />
            <Row label="Status" value={student.status} />
            <Row label="Guardian phone" value={student.guardianPhone ?? "—"} />
            <Row label="Medical / notes" value={student.medicalNotes ?? "None"} />
            <Row
              label="Guardian(s)"
              value={student.parentLinks.map((p) => p.parent.email).join(", ") || "None linked"}
            />
            <Row
              label="Hostel"
              value={
                hostel
                  ? `${hostel.room.block ? hostel.room.block + " / " : ""}${hostel.room.name}${hostel.bedLabel ? " · bed " + hostel.bedLabel : ""}`
                  : "Not allocated"
              }
            />
            <Row label="Transport" value={transport ? transport.route.name : "Not enrolled"} />
          </dl>
        </Card>

        <Card title="Fee invoices">
          {student.invoices.length === 0 ? (
            <p className="text-sm text-ink/40 py-4 text-center">No invoices yet.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {student.invoices.map((inv) => (
                <li
                  key={inv.id}
                  className="flex justify-between items-start gap-2 border-b border-line/80 pb-2.5 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-semibold tabular-nums">{formatNaira(inv.totalAmount)}</p>
                    <p className="text-xs text-ink/45 mt-0.5">
                      Paid {formatNaira(inv.amountPaid)} · {formatDate(inv.createdAt)}
                    </p>
                  </div>
                  <StatusPill status={inv.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Recent attendance">
          {student.attendances.length === 0 ? (
            <p className="text-sm text-ink/40 py-4 text-center">No attendance yet.</p>
          ) : (
            <ul className="divide-y divide-line/80 text-sm">
              {student.attendances.map((a) => (
                <li key={a.id} className="flex justify-between items-center py-2">
                  <span className="text-ink/70">{formatDate(a.date)}</span>
                  <StatusPill status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div id="student-documents" className="scroll-mt-28">
        <StudentDocuments
          studentId={student.id}
          canManage={canManage}
          documents={student.documents.map((d) => ({
            id: d.id,
            label: d.label,
            fileUrl: d.fileUrl,
            uploadedAt: d.uploadedAt.toISOString(),
          }))}
        />
      </div>

      <div id="student-results" className="scroll-mt-28 mt-4 sm:mt-5 max-w-6xl">
        <Card title="Results (all terms)" flush>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-ink/50">
                  <th className="py-2.5 px-4 font-medium">Subject</th>
                  <th className="py-2.5 px-2 font-medium text-right">CA1</th>
                  <th className="py-2.5 px-2 font-medium text-right">CA2</th>
                  <th className="py-2.5 px-2 font-medium text-right">Exam</th>
                  <th className="py-2.5 px-2 font-medium text-right">Total</th>
                  <th className="py-2.5 px-2 font-medium text-right">Grade</th>
                  <th className="py-2.5 px-4 font-medium">Remark</th>
                </tr>
              </thead>
              <tbody>
                {student.scores.map((s) => (
                  <tr key={s.id} className="border-b border-line/70 last:border-0">
                    <td className="py-2 px-4">{s.armSubject.subject.name}</td>
                    <td className="py-2 px-2 text-right tabular-nums">{s.ca1}</td>
                    <td className="py-2 px-2 text-right tabular-nums">{s.ca2}</td>
                    <td className="py-2 px-2 text-right tabular-nums">{s.exam}</td>
                    <td className="py-2 px-2 text-right font-semibold tabular-nums">{s.total}</td>
                    <td className="py-2 px-2 text-right">{s.grade ?? "—"}</td>
                    <td className="py-2 px-4 text-ink/70">{s.remark ?? "—"}</td>
                  </tr>
                ))}
                {student.scores.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-ink/40 py-8">
                      No scores entered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </PortalShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink/45 shrink-0 text-[13px]">{label}</dt>
      <dd className="text-right text-ink break-words text-[13px]">{value}</dd>
    </div>
  );
}
