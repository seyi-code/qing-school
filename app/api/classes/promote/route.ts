import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { resolveSchoolId } from "@/lib/tenant-scope";

const PromoteSchema = z.object({
  fromArmId: z.string(),
  toArmId: z.string(),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || !can(session.role, "MANAGE_CLASSES")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = PromoteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const { fromArmId, toArmId } = parsed.data;
  const schoolId = await resolveSchoolId(session);

  if (schoolId) {
    const arms = await prisma.arm.findMany({
      where: {
        id: { in: [fromArmId, toArmId] },
        schoolClass: { schoolId },
      },
      select: { id: true },
    });
    if (arms.length !== 2) {
      return NextResponse.json(
        { error: "Both source and target classes must belong to your school." },
        { status: 403 }
      );
    }
  }

  const result = await prisma.student.updateMany({
    where: {
      armId: fromArmId,
      status: "ACTIVE",
      ...(schoolId ? { schoolId } : {}),
    },
    data: { armId: toArmId },
  });

  await logAudit({
    userId: session.userId,
    schoolId: schoolId ?? undefined,
    action: "PROMOTE_CLASS",
    entity: "Arm",
    details: { fromArmId, toArmId, count: result.count },
  });

  return NextResponse.json({ promoted: result.count });
}
