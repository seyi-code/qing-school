import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { resolveSchoolId } from "@/lib/tenant-scope";

const Schema = z.object({
  schoolName: z.string().min(1).max(120),
  motto: z.string().max(200).optional(),
  footerNote: z.string().max(300).optional(),
  showPosition: z.boolean().default(true),
  showAttendance: z.boolean().default(true),
  principalTitle: z.string().max(80).optional(),
  headerBg: z.string().max(20).optional(),
  accentColor: z.string().max(20).optional(),
  logoUrl: z.string().max(500).optional(),
  sections: z.array(z.string()).optional(),
  domainsMode: z.enum(["auto", "primary", "secondary", "hidden"]).optional(),
});

const DEFAULT_SECTIONS = [
  "header",
  "studentInfo",
  "scoresTable",
  "attendance",
  "position",
  "remarks",
  "signatures",
  "footer",
];

/** Per-tenant template key — avoids global KMS leak without a schema migration. */
function templateNameForSchool(schoolId: string | null) {
  return schoolId ? `school:${schoolId}` : "Default";
}

async function defaultsForSchool(schoolId: string | null) {
  const school = schoolId
    ? await prisma.school.findUnique({
        where: { id: schoolId },
        select: {
          name: true,
          motto: true,
          logoUrl: true,
          primaryColor: true,
          accentColor: true,
        },
      })
    : null;

  return {
    schoolName: school?.name || "Your School",
    motto: school?.motto || "",
    footerNote: "This is a computer-generated report.",
    showPosition: true,
    showAttendance: true,
    principalTitle: "Principal",
    headerBg: school?.primaryColor || "#0f2748",
    accentColor: school?.accentColor || "#c9a227",
    logoUrl: school?.logoUrl || "/logo.svg",
    domainsMode: "auto" as const,
    sections: DEFAULT_SECTIONS,
  };
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const schoolId = await resolveSchoolId(session);
  const name = templateNameForSchool(schoolId);
  const tpl = await prisma.reportCardTemplate.findFirst({
    where: { name },
    orderBy: { updatedAt: "desc" },
  });

  if (tpl) {
    return NextResponse.json({ template: JSON.parse(tpl.configJson) });
  }

  return NextResponse.json({ template: await defaultsForSchool(schoolId) });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (
    !session ||
    !["ADMIN", "IT", "PRINCIPAL", "PLATFORM_ADMIN"].includes(session.role)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const schoolId = await resolveSchoolId(session);
  const name = templateNameForSchool(schoolId);

  const existing = await prisma.reportCardTemplate.findFirst({ where: { name } });
  if (existing) {
    await prisma.reportCardTemplate.update({
      where: { id: existing.id },
      data: { configJson: JSON.stringify(parsed.data) },
    });
  } else {
    await prisma.reportCardTemplate.create({
      data: { name, configJson: JSON.stringify(parsed.data) },
    });
  }

  return NextResponse.json({ ok: true, template: parsed.data });
}
