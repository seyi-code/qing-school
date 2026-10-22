import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { PLAN_STUDENT_CAPS } from "@/lib/plan-caps";

const EditSchema = z.object({
  schoolId: z.string().min(1),
  name: z.string().min(3).max(120).optional(),
  shortName: z.string().min(2).max(12).optional(),
  phone: z.string().max(40).optional().nullable(),
  address: z.string().max(200).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  plan: z.enum(["STARTER", "PRO", "ENTERPRISE"]).optional(),
  maxStudents: z.number().int().min(50).max(50000).optional(),
  isActive: z.boolean().optional(),
});

const DeleteSchema = z.object({
  schoolId: z.string().min(1),
  /** Hard-delete only when empty (no students). Soft-delete otherwise. */
  hard: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Only platform admins can edit tenants." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = EditSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid tenant data" },
      { status: 400 }
    );
  }

  const { schoolId, ...fields } = parsed.data;
  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) return NextResponse.json({ error: "School not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (fields.name !== undefined) data.name = fields.name.trim();
  if (fields.shortName !== undefined) data.shortName = fields.shortName.trim().toUpperCase();
  if (fields.phone !== undefined) data.phone = fields.phone || null;
  if (fields.address !== undefined) data.address = fields.address || null;
  if (fields.email !== undefined) data.email = fields.email || null;
  if (fields.plan !== undefined) {
    data.plan = fields.plan;
    if (fields.maxStudents === undefined) {
      data.maxStudents = PLAN_STUDENT_CAPS[fields.plan];
    }
  }
  if (fields.maxStudents !== undefined) data.maxStudents = fields.maxStudents;
  if (fields.isActive !== undefined) data.isActive = fields.isActive;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No changes" }, { status: 400 });
  }

  const updated = await prisma.school.update({ where: { id: schoolId }, data });

  await logAudit({
    userId: session.userId,
    action: "EDIT_TENANT",
    entity: "School",
    entityId: schoolId,
    details: { slug: school.slug, changes: data },
  });

  return NextResponse.json({
    ok: true,
    school: {
      id: updated.id,
      name: updated.name,
      shortName: updated.shortName,
      slug: updated.slug,
      plan: updated.plan,
      maxStudents: updated.maxStudents,
      isActive: updated.isActive,
    },
  });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Only platform admins can delete tenants." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = DeleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "schoolId required" }, { status: 400 });
  }

  const { schoolId, hard } = parsed.data;
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: { _count: { select: { students: true, users: true } } },
  });
  if (!school) return NextResponse.json({ error: "School not found" }, { status: 404 });

  // Never hard-delete flagship KMS
  if ((school.slug || "").toLowerCase() === "kms") {
    return NextResponse.json(
      { error: "Cannot delete the flagship KMS tenant. Suspend it instead." },
      { status: 400 }
    );
  }

  if (hard) {
    if (school._count.students > 0) {
      return NextResponse.json(
        {
          error: `School still has ${school._count.students} student(s). Remove students first, or use soft-delete (suspend).`,
        },
        { status: 400 }
      );
    }
    await prisma.school.delete({ where: { id: schoolId } });
    await logAudit({
      userId: session.userId,
      action: "DELETE_TENANT",
      entity: "School",
      entityId: schoolId,
      details: { slug: school.slug, hard: true },
    });
    return NextResponse.json({ ok: true, deleted: true, hard: true });
  }

  // Soft-delete: suspend
  const updated = await prisma.school.update({
    where: { id: schoolId },
    data: { isActive: false, subscriptionStatus: "SUSPENDED" },
  });
  await logAudit({
    userId: session.userId,
    action: "SOFT_DELETE_TENANT",
    entity: "School",
    entityId: schoolId,
    details: { slug: school.slug },
  });
  return NextResponse.json({
    ok: true,
    deleted: false,
    hard: false,
    school: { id: updated.id, isActive: updated.isActive, subscriptionStatus: updated.subscriptionStatus },
  });
}
