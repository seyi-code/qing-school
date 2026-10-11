import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { resolveSchoolId, assertStudentInTenant } from "@/lib/tenant-scope";
import { toMoney } from "@/lib/money";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const student = await prisma.student.findUnique({
    where: { id: params.id },
    include: {
      arm: { include: { schoolClass: true } },
      invoices: { include: { payments: true }, orderBy: { createdAt: "desc" } },
      scores: { include: { armSubject: { include: { subject: true } } } },
      attendances: { orderBy: { date: "desc" }, take: 30 },
      parentLinks: { include: { parent: { select: { email: true } } } },
    },
  });

  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  const schoolId = await resolveSchoolId(session);
  if (schoolId && student.schoolId && student.schoolId !== schoolId) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  if (session.role === "STUDENT") {
    const owns = await prisma.student.findFirst({ where: { id: params.id, userId: session.userId } });
    if (!owns) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (session.role === "PARENT") {
    const linked = await prisma.parentLink.findFirst({
      where: { studentId: params.id, parentId: session.userId },
    });
    if (!linked) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ student });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || !can(session.role, "MANAGE_STUDENTS")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const schoolId = await resolveSchoolId(session);
  const guard = await assertStudentInTenant(params.id, schoolId);
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const body = await req.json().catch(() => ({}));
  const allowedFields = [
    "firstName",
    "lastName",
    "otherNames",
    "gender",
    "address",
    "previousSchool",
    "medicalNotes",
    "guardianPhone",
    "status",
  ] as const;

  const data: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) data[field] = body[field];
  }

  if ("armId" in body) {
    data.armId = body.armId === "" || body.armId === null ? null : body.armId;
  }

  if (typeof body.admissionNumber === "string") {
    const next = body.admissionNumber.trim();
    if (!next) {
      return NextResponse.json({ error: "Admission number cannot be empty." }, { status: 400 });
    }
    const clash = await prisma.student.findFirst({
      where: {
        admissionNumber: next,
        NOT: { id: params.id },
      },
      select: { id: true },
    });
    if (clash) {
      return NextResponse.json(
        { error: "That admission number is already used by another student." },
        { status: 409 }
      );
    }
    data.admissionNumber = next;
  }

  if (typeof data.status === "string") {
    const allowed = ["ACTIVE", "APPLIED", "WITHDRAWN", "GRADUATED"];
    if (!allowed.includes(data.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
  }

  const student = await prisma.student.update({ where: { id: params.id }, data });

  await logAudit({
    userId: session.userId,
    schoolId: schoolId ?? undefined,
    action: data.status === "WITHDRAWN" ? "WITHDRAW_STUDENT" : "UPDATE_STUDENT",
    entity: "Student",
    entityId: student.id,
    details: data,
  });

  return NextResponse.json({ student });
}

/** Permanent delete — Admin/IT only. Requires matching admission number. */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || !["ADMIN", "IT"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const schoolId = await resolveSchoolId(session);
  const guard = await assertStudentInTenant(params.id, schoolId);
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const body = await req.json().catch(() => ({}));
  const confirmAdmissionNumber =
    typeof body.confirmAdmissionNumber === "string" ? body.confirmAdmissionNumber.trim() : "";

  const student = await prisma.student.findUnique({ where: { id: params.id } });
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  if (confirmAdmissionNumber !== student.admissionNumber) {
    return NextResponse.json(
      {
        error: "Type the admission number exactly to confirm permanent delete.",
        expected: student.admissionNumber,
      },
      { status: 400 }
    );
  }

  const paid = await prisma.invoice.aggregate({
    where: { studentId: params.id },
    _sum: { amountPaid: true },
  });
  if (toMoney(paid._sum.amountPaid) > 0 && !body.force) {
    return NextResponse.json(
      {
        error: "Student has fee payments recorded. Use force=true only if you intend to erase them.",
      },
      { status: 409 }
    );
  }

  await prisma.student.delete({ where: { id: params.id } });

  await logAudit({
    userId: session.userId,
    schoolId: schoolId ?? undefined,
    action: "DELETE_STUDENT",
    entity: "Student",
    entityId: params.id,
    details: {
      admissionNumber: student.admissionNumber,
      name: `${student.firstName} ${student.lastName}`,
    },
  });

  return NextResponse.json({ ok: true });
}
