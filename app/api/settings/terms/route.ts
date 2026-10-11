import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { resolveSchoolId, schoolWhere } from "@/lib/tenant-scope";

const SetCurrentSchema = z.object({
  termId: z.string(),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const schoolId = await resolveSchoolId(session);
  const terms = await prisma.term.findMany({
    where: schoolId ? { session: { schoolId } } : undefined,
    include: { session: true },
    orderBy: { startDate: "desc" },
  });
  return NextResponse.json({ terms });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || !can(session.role, "MANAGE_SYSTEM_SETTINGS")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = SetCurrentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "termId required" }, { status: 400 });

  const schoolId = await resolveSchoolId(session);
  const term = await prisma.term.findUnique({
    where: { id: parsed.data.termId },
    include: { session: true },
  });
  if (!term) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (schoolId && term.session.schoolId && term.session.schoolId !== schoolId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.term.updateMany({
      where: schoolId ? { session: { schoolId } } : {},
      data: { isCurrent: false },
    }),
    prisma.term.update({
      where: { id: term.id },
      data: { isCurrent: true },
    }),
  ]);

  return NextResponse.json({ ok: true, termId: term.id });
}
