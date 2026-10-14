import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession, hashPassword } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { resolveSchoolId } from "@/lib/tenant-scope";
import { logAudit } from "@/lib/audit";
import { validatePassword } from "@/lib/password-policy";

export const dynamic = "force-dynamic";

const Schema = z.object({
  email: z.string().email(),
  temporaryPassword: z.string().min(8),
});

/**
 * Enable portal login for a student: create/link User (role STUDENT).
 * Admin shares email + temporary password; student must change on first login if mustChangePassword.
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session || !can(session.role, "MANAGE_STUDENTS")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const schoolId = await resolveSchoolId(session);
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Valid email and temporary password (min 8) required." },
      { status: 400 }
    );
  }

  const check = validatePassword(parsed.data.temporaryPassword);
  if (!check.ok) {
    return NextResponse.json({ error: check.message }, { status: 400 });
  }

  const student = await prisma.student.findUnique({ where: { id: params.id } });
  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }
  if (schoolId && student.schoolId && student.schoolId !== schoolId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const passwordHash = await hashPassword(parsed.data.temporaryPassword);

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser && existingUser.id !== student.userId) {
    return NextResponse.json(
      { error: "That email is already used by another account." },
      { status: 409 }
    );
  }

  let userId = student.userId;

  if (userId) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        email,
        passwordHash,
        role: "STUDENT",
        isActive: true,
        mustChangePassword: true,
        schoolId: student.schoolId ?? schoolId ?? undefined,
      },
    });
  } else if (existingUser) {
    userId = existingUser.id;
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        role: "STUDENT",
        isActive: true,
        mustChangePassword: true,
        schoolId: student.schoolId ?? schoolId ?? undefined,
      },
    });
    await prisma.student.update({
      where: { id: student.id },
      data: { userId },
    });
  } else {
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "STUDENT",
        isActive: true,
        mustChangePassword: true,
        schoolId: student.schoolId ?? schoolId ?? undefined,
      },
    });
    userId = user.id;
    await prisma.student.update({
      where: { id: student.id },
      data: { userId },
    });
  }

  await logAudit({
    userId: session.userId,
    schoolId: student.schoolId ?? schoolId,
    action: "ENABLE_STUDENT_PORTAL",
    entity: "Student",
    entityId: student.id,
    details: { email, userId },
  });

  return NextResponse.json({
    ok: true,
    email,
    message:
      "Portal access enabled. Share the email and temporary password with the student/guardian. They must change password on first login.",
  });
}
