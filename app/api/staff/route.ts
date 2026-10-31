import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession, hashPassword } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { validatePassword, passwordPolicyHint } from "@/lib/password-policy";
import { resolveSchoolId, schoolWhere, assertStaffInTenant } from "@/lib/tenant-scope";

const CreateStaffSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  category: z.enum(["TEACHING", "NON_TEACHING"]),
  designation: z.string().optional(),
  qualification: z.string().optional(),
  phone: z.string().optional(),
  monthlySalary: z.coerce.number().nonnegative().optional(),
  role: z.enum(["TEACHER", "ACCOUNTANT", "SECRETARY", "IT", "PRINCIPAL", "ADMIN"]),
});

const UpdateStaffSchema = z.object({
  id: z.string().min(1),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  category: z.enum(["TEACHING", "NON_TEACHING"]).optional(),
  designation: z.string().optional().nullable(),
  qualification: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  monthlySalary: z.coerce.number().nonnegative().optional().nullable(),
  role: z.enum(["TEACHER", "ACCOUNTANT", "SECRETARY", "IT", "PRINCIPAL", "ADMIN"]).optional(),
  isActive: z.boolean().optional(),
});

async function generateStaffId(schoolId: string | null | undefined): Promise<string> {
  const school = schoolId
    ? await prisma.school.findUnique({ where: { id: schoolId }, select: { shortName: true, slug: true } })
    : null;
  const tag = (school?.shortName || school?.slug || "SCH")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6) || "SCH";
  const count = await prisma.staff.count({
    where: schoolId ? { schoolId } : undefined,
  });
  for (let i = count + 1; i < count + 500; i++) {
    const candidate = `${tag}-STF-${String(i).padStart(4, "0")}`;
    const exists = await prisma.staff.findUnique({ where: { staffId: candidate } });
    if (!exists) return candidate;
  }
  return `${tag}-STF-${Date.now().toString(36).toUpperCase()}`;
}

async function repairStaffIdsForSchool(schoolId: string) {
  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) return { fixed: 0, details: [] as { from: string; to: string }[] };
  const tag = (school.shortName || school.slug)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
  const staff = await prisma.staff.findMany({
    where: { schoolId },
    orderBy: { createdAt: "asc" },
  });
  const details: { from: string; to: string }[] = [];
  let n = 0;
  for (const s of staff) {
    const expectedPrefix = `${tag}-STF-`;
    if (s.staffId.toUpperCase().startsWith(expectedPrefix)) continue;
    n += 1;
    let to = `${tag}-STF-${String(n).padStart(4, "0")}`;
    while (await prisma.staff.findFirst({ where: { staffId: to, NOT: { id: s.id } } })) {
      n += 1;
      to = `${tag}-STF-${String(n).padStart(4, "0")}`;
    }
    details.push({ from: s.staffId, to });
    await prisma.staff.update({ where: { id: s.id }, data: { staffId: to } });
  }
  return { fixed: details.length, details };
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const schoolId = await resolveSchoolId(session);
  const staff = await prisma.staff.findMany({
    where: schoolWhere(schoolId),
    include: { user: { select: { email: true, role: true, isActive: true } } },
    orderBy: [{ lastName: "asc" }],
  });
  return NextResponse.json({ staff });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session || !can(session.role, "MANAGE_STAFF")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);

  if (body?.action === "resetPassword" && body?.staffId) {
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
    const check = validatePassword(newPassword);
    if (!check.ok) {
      return NextResponse.json({ error: check.message, hint: passwordPolicyHint() }, { status: 400 });
    }
    const staff = await prisma.staff.findUnique({ where: { id: body.staffId } });
    if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    const schoolIdReset = await resolveSchoolId(session);
    const g = await assertStaffInTenant(staff.id, schoolIdReset);
    if (!g.ok) return NextResponse.json({ error: g.error }, { status: g.status });
    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: staff.userId },
      data: { passwordHash, mustChangePassword: true },
    });
    await logAudit({
      userId: session.userId,
      action: "RESET_STAFF_PASSWORD",
      entity: "Staff",
      entityId: staff.id,
    });
    return NextResponse.json({ ok: true, message: "Password reset." });
  }

  const parsed = UpdateStaffSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }

  const staff = await prisma.staff.findUnique({ where: { id: parsed.data.id } });
  if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });
  const schoolIdPatch = await resolveSchoolId(session);
  const guard = await assertStaffInTenant(staff.id, schoolIdPatch);
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const data = parsed.data;
  const updated = await prisma.$transaction(async (tx) => {
    const s = await tx.staff.update({
      where: { id: staff.id },
      data: {
        firstName: data.firstName ?? undefined,
        lastName: data.lastName ?? undefined,
        category: data.category ?? undefined,
        designation: data.designation === undefined ? undefined : data.designation,
        qualification: data.qualification === undefined ? undefined : data.qualification,
        phone: data.phone === undefined ? undefined : data.phone,
        monthlySalary: data.monthlySalary === undefined ? undefined : data.monthlySalary,
        isActive: data.isActive ?? undefined,
      },
    });
    if (data.role !== undefined || data.isActive !== undefined) {
      await tx.user.update({
        where: { id: staff.userId },
        data: {
          role: data.role ?? undefined,
          isActive: data.isActive ?? undefined,
        },
      });
    }
    return s;
  });

  await logAudit({
    userId: session.userId,
    action: "UPDATE_STAFF",
    entity: "Staff",
    entityId: updated.id,
    details: { role: data.role, isActive: data.isActive },
  });

  return NextResponse.json({ staff: updated });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || !can(session.role, "MANAGE_STAFF")) {
    return NextResponse.json({ error: "You don't have permission to add staff." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);

  if (body?.action === "repairStaffIds") {
    if (!["PLATFORM_ADMIN", "ADMIN", "IT"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const schoolId = await resolveSchoolId(session);
    if (!schoolId) {
      return NextResponse.json({ error: "No active school" }, { status: 400 });
    }
    const result = await repairStaffIdsForSchool(schoolId);
    await logAudit({
      userId: session.userId,
      schoolId,
      action: "REPAIR_STAFF_IDS",
      entity: "Staff",
      details: result,
    });
    return NextResponse.json({ ok: true, ...result });
  }

  const parsed = CreateStaffSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }

  const data = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });
  }

  const defaultPassword = "Kms@" + Math.random().toString(36).slice(2, 8) + "A1!";
  const passwordHash = await hashPassword(defaultPassword);
  const schoolIdCreate = await resolveSchoolId(session);
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      role: data.role,
      schoolId: schoolIdCreate ?? undefined,
      mustChangePassword: true,
    },
  });

  const staff = await prisma.staff.create({
    data: {
      schoolId: schoolIdCreate ?? undefined,
      staffId: await generateStaffId(schoolIdCreate),
      userId: user.id,
      firstName: data.firstName,
      lastName: data.lastName,
      category: data.category,
      designation: data.designation,
      qualification: data.qualification,
      phone: data.phone,
      monthlySalary: data.monthlySalary,
    },
  });

  await logAudit({
    userId: session.userId,
    action: "CREATE_STAFF",
    entity: "Staff",
    entityId: staff.id,
    details: { email: data.email, role: data.role },
  });

  return NextResponse.json({ staff, defaultPassword }, { status: 201 });
}
