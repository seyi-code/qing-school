import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const Schema = z.object({
  schoolName: z.string().min(1),
  motto: z.string().optional(),
  footerNote: z.string().optional(),
  showPosition: z.boolean().optional(),
  showAttendance: z.boolean().optional(),
  principalTitle: z.string().optional(),
  headerBg: z.string().optional(),
  accentColor: z.string().optional(),
  logoUrl: z.string().optional(),
  sections: z.array(z.string()).optional(),
  domainsMode: z.enum(["auto", "primary", "secondary", "hidden"]).optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tpl = await prisma.reportCardTemplate.findFirst({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json({
    config: tpl
      ? JSON.parse(tpl.configJson)
      : {
          schoolName: "Kayvlop Magnificent School",
          motto: "Education with Godliness",
          sections: [
            "header",
            "studentInfo",
            "scoresTable",
            "attendance",
            "position",
            "remarks",
            "signatures",
            "footer",
          ],
          domainsMode: "auto",
        },
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || !["ADMIN", "IT", "PRINCIPAL"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const existing = await prisma.reportCardTemplate.findFirst({ orderBy: { updatedAt: "desc" } });
  if (existing) {
    await prisma.reportCardTemplate.update({
      where: { id: existing.id },
      data: { configJson: JSON.stringify(parsed.data), name: "Default" },
    });
  } else {
    await prisma.reportCardTemplate.create({
      data: { name: "Default", configJson: JSON.stringify(parsed.data) },
    });
  }
  return NextResponse.json({ ok: true });
}
