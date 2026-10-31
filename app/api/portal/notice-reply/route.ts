import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { resolveSchoolId, schoolWhere } from "@/lib/tenant-scope";

const Schema = z.object({
  noticeId: z.string().min(1),
  message: z.string().min(5).max(2000),
  name: z.string().min(1).max(120),
  contact: z.string().min(3).max(120),
});

const AUDIENCE_BY_ROLE: Record<string, string[]> = {
  STUDENT: ["ALL", "STUDENTS"],
  PARENT: ["ALL", "PARENTS"],
  TEACHER: ["ALL", "STAFF"],
};

/** Portal users message the school about a notice → stored as COMPLAINT for office. */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const allowed = AUDIENCE_BY_ROLE[session.role];
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  const schoolId = await resolveSchoolId(session);
  const notice = await prisma.notice.findFirst({
    where: {
      id: parsed.data.noticeId,
      ...schoolWhere(schoolId),
      audience: { in: allowed },
    },
  });
  if (!notice) {
    return NextResponse.json({ error: "Notice not found" }, { status: 404 });
  }

  const name = parsed.data.name.trim();
  const contact = (parsed.data.contact || session.email || "").trim();
  const message = parsed.data.message.trim();
  const subject = `Re: ${notice.title}`.slice(0, 150);

  const created = await prisma.notice.create({
    data: {
      title: `[Complaint] ${subject}`,
      body: `From: ${name}\nContact: ${contact}\nRegarding notice: ${notice.id}\n\n${message}`,
      audience: "COMPLAINT",
      publishToWeb: false,
      status: "OPEN",
      contactName: name,
      contactValue: contact,
      schoolId: schoolId ?? undefined,
      createdBy: session.userId,
    },
  });

  await logAudit({
    userId: session.userId,
    action: "PORTAL_NOTICE_REPLY",
    entity: "Notice",
    entityId: created.id,
    details: { regarding: notice.id, role: session.role },
  });

  return NextResponse.json({ ok: true });
}
