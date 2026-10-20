import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { assertUnderStudentCap, resolveSchoolIdFromRequest } from "@/lib/tenant-scope";
import { generateAdmissionNumber } from "@/lib/admission";

const ApplicationSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  otherNames: z.string().max(80).optional(),
  gender: z.enum(["Male", "Female"]).optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().max(300).optional(),
  previousSchool: z.string().max(150).optional(),
  parentName: z.string().min(1).max(120),
  parentPhone: z.string().min(7).max(20),
  parentEmail: z.string().email().optional().or(z.literal("")),
  desiredClass: z.string().max(80).optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = ApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid application" },
      { status: 400 }
    );
  }

  const d = parsed.data;
  const bodySlug =
    typeof (body as { schoolSlug?: string })?.schoolSlug === "string"
      ? (body as { schoolSlug: string }).schoolSlug
      : null;
  const schoolId = await resolveSchoolIdFromRequest(req, { bodySlug });
  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school || !school.isActive) {
    return NextResponse.json({ error: "School not available for admissions." }, { status: 403 });
  }
  const cap = await assertUnderStudentCap(school.id);
  if (!cap.ok) {
    return NextResponse.json({ error: cap.error }, { status: 403 });
  }
  const { admissionNumber, branchId } = await generateAdmissionNumber(school.id);

  const medicalNotes = [
    `Parent/Guardian: ${d.parentName}`,
    `Phone: ${d.parentPhone}`,
    d.parentEmail ? `Email: ${d.parentEmail}` : null,
    d.desiredClass ? `Desired class: ${d.desiredClass}` : null,
    "Source: Online admissions form",
  ]
    .filter(Boolean)
    .join(" | ");

  const student = await prisma.student.create({
    data: {
      schoolId: school.id,
      branchId: branchId ?? undefined,
      admissionNumber,
      firstName: d.firstName,
      lastName: d.lastName,
      otherNames: d.otherNames || undefined,
      gender: d.gender,
      dateOfBirth: d.dateOfBirth ? new Date(d.dateOfBirth) : undefined,
      address: d.address || undefined,
      previousSchool: d.previousSchool || undefined,
      medicalNotes,
      status: "APPLIED",
    },
  });

  await logAudit({
    action: "ONLINE_ADMISSION_APPLICATION",
    entity: "Student",
    entityId: student.id,
    schoolId: school.id,
    details: { admissionNumber, parentPhone: d.parentPhone },
  });

  return NextResponse.json({
    ok: true,
    admissionNumber,
    message:
      "Application received. The school office will contact you. Keep your application number.",
  });
}
