import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { resolveSchoolId } from "@/lib/tenant-scope";

const SessionSchema = z.object({
  action: z.literal("create_session"),
  name: z.string().min(2),
  makeCurrent: z.boolean().optional(),
  terms: z.array(z.string().min(1)).optional(),
});

const SeedBandsSchema = z.object({
  action: z.literal("seed_grade_bands"),
  replace: z.boolean().optional(),
});

const DEFAULT_BANDS = [
  { minScore: 75, maxScore: 100, grade: "A", remark: "Excellent" },
  { minScore: 65, maxScore: 74.99, grade: "B", remark: "Very Good" },
  { minScore: 55, maxScore: 64.99, grade: "C", remark: "Good" },
  { minScore: 45, maxScore: 54.99, grade: "D", remark: "Fair" },
  { minScore: 40, maxScore: 44.99, grade: "E", remark: "Pass" },
  { minScore: 0, maxScore: 39.99, grade: "F", remark: "Fail" },
];

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || !can(session.role, "MANAGE_SYSTEM_SETTINGS")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const schoolId = await resolveSchoolId(session);
  const body = await req.json().catch(() => null);
  if (!body?.action) {
    return NextResponse.json({ error: "action required" }, { status: 400 });
  }

  if (body.action === "create_session") {
    const parsed = SessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid session payload" }, { status: 400 });
    }
    if (!schoolId) {
      return NextResponse.json({ error: "No active school" }, { status: 400 });
    }
    const name = parsed.data.name.trim();
    const existing = await prisma.session.findFirst({ where: { schoolId, name } });
    if (existing) {
      return NextResponse.json(
        { error: "That academic year already exists for this school." },
        { status: 409 }
      );
    }
    const termNames =
      parsed.data.terms && parsed.data.terms.length > 0
        ? parsed.data.terms
        : ["First Term", "Second Term", "Third Term"];
    const makeCurrent = Boolean(parsed.data.makeCurrent);
    if (makeCurrent) {
      await prisma.session.updateMany({ where: { schoolId }, data: { isCurrent: false } });
    }
    const row = await prisma.session.create({
      data: {
        schoolId,
        name,
        isCurrent: makeCurrent,
        terms: {
          create: termNames.map((tn, i) => ({
            name: tn,
            isCurrent: makeCurrent && i === 0,
          })),
        },
      },
      include: { terms: true },
    });
    await logAudit({
      userId: session.userId,
      schoolId,
      action: "CREATE_SESSION",
      entity: "Session",
      entityId: row.id,
      details: { name, makeCurrent, terms: termNames },
    });
    return NextResponse.json({ ok: true, session: row });
  }

  if (body.action === "seed_grade_bands") {
    const parsed = SeedBandsSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
    if (parsed.data.replace) {
      await prisma.gradeBand.deleteMany({});
    } else {
      const n = await prisma.gradeBand.count();
      if (n > 0) {
        return NextResponse.json(
          { error: "Grade bands already exist. Use replace to overwrite." },
          { status: 409 }
        );
      }
    }
    await prisma.gradeBand.createMany({ data: DEFAULT_BANDS });
    await logAudit({
      userId: session.userId,
      schoolId: schoolId ?? undefined,
      action: "SEED_GRADE_BANDS",
      entity: "GradeBand",
      details: { count: DEFAULT_BANDS.length, replace: Boolean(parsed.data.replace) },
    });
    const bands = await prisma.gradeBand.findMany({ orderBy: { minScore: "desc" } });
    return NextResponse.json({ ok: true, bands });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
