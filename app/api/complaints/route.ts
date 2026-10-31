import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import { sendSms } from "@/lib/integrations/messaging";
import { resolveSchoolId, schoolWhere } from "@/lib/tenant-scope";

const CreateSchema = z.object({
  name: z.string().min(1).max(120),
  contact: z.string().min(5).max(120),
  subject: z.string().min(3).max(150),
  message: z.string().min(10).max(2000),
  schoolSlug: z.string().min(1).max(80).optional(),
});

const UpdateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["OPEN", "ACKNOWLEDGED", "RESOLVED", "ARCHIVED"]).optional(),
  internalNote: z.string().max(2000).optional(),
});

const ReplySchema = z.object({
  id: z.string().min(1),
  reply: z.string().min(2).max(1500),
});

const DeleteSchema = z.object({
  id: z.string().min(1),
});

function looksLikeEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function looksLikePhone(v: string) {
  const digits = v.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

async function resolveComplaintSchoolId(schoolSlug?: string | null) {
  if (schoolSlug) {
    const school = await prisma.school.findFirst({
      where: { slug: schoolSlug, isActive: true },
      select: { id: true },
    });
    if (school) return school.id;
  }
  return null;
}

/** Public create + staff reply (when body has id + reply). */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  if (body?.reply && body?.id) {
    const session = await getSession();
    if (!session || !can(session.role, "MANAGE_NOTICES")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const parsed = ReplySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid reply" }, { status: 400 });
    }
    const schoolId = await resolveSchoolId(session);
    const existing = await prisma.notice.findFirst({
      where: {
        id: parsed.data.id,
        audience: "COMPLAINT",
        ...schoolWhere(schoolId),
      },
    });
    if (!existing) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
    }

    const contact =
      existing.contactValue ||
      (existing.body.match(/Contact:\s*(.+)/i)?.[1] || "").trim();
    if (!contact) {
      return NextResponse.json({ error: "No contact on this complaint" }, { status: 400 });
    }

    const school = existing.schoolId
      ? await prisma.school.findUnique({
          where: { id: existing.schoolId },
          select: { name: true, shortName: true },
        })
      : null;
    const fromLabel = school?.shortName || school?.name || "School office";
    const replyText = parsed.data.reply.trim();
    const outbound = `${fromLabel}: ${replyText}`.slice(0, 320);

    let channel = "NONE";
    let sent = false;
    let detail = "";

    if (looksLikeEmail(contact)) {
      channel = "EMAIL";
      if (!isEmailConfigured()) {
        return NextResponse.json(
          { error: "Email is not configured (RESEND_API_KEY)" },
          { status: 503 }
        );
      }
      const r = await sendEmail({
        to: contact.trim(),
        subject: `Re: ${existing.title.replace(/^\[Complaint\]\s*/i, "")}`,
        text: `${replyText}\n\n— ${fromLabel}`,
      });
      sent = r.ok;
      detail = r.ok ? r.id || "sent" : r.error;
      await prisma.messageLog.create({
        data: {
          channel: "EMAIL",
          recipient: contact.trim(),
          body: replyText,
          status: r.ok ? "SENT" : "FAILED",
        },
      });
    } else if (looksLikePhone(contact)) {
      channel = "SMS";
      const r = await sendSms({ to: contact.trim(), body: outbound });
      sent = r.ok;
      detail = r.ok ? "sent" : "failed";
    } else {
      return NextResponse.json(
        { error: "Contact is neither a valid email nor phone" },
        { status: 400 }
      );
    }

    if (!sent) {
      return NextResponse.json(
        { error: `Failed to send ${channel}: ${detail || "unknown"}` },
        { status: 502 }
      );
    }

    const stamp = `\n\n--- Reply (${new Date().toISOString().slice(0, 16)}) ---\n${replyText}`;
    const updated = await prisma.notice.update({
      where: { id: existing.id },
      data: {
        body: existing.body + stamp,
        status: existing.status === "OPEN" ? "ACKNOWLEDGED" : existing.status,
      },
    });

    await logAudit({
      userId: session.userId,
      action: "REPLY_COMPLAINT",
      entity: "Notice",
      entityId: existing.id,
      details: { channel, contact },
    });

    return NextResponse.json({ ok: true, notice: updated, channel });
  }

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please fill all fields properly" }, { status: 400 });
  }

  const { name, contact, subject, message, schoolSlug } = parsed.data;
  const schoolId = await resolveComplaintSchoolId(schoolSlug);

  const notice = await prisma.notice.create({
    data: {
      title: `[Complaint] ${subject}`,
      body: `From: ${name}\nContact: ${contact}\n\n${message}`,
      audience: "COMPLAINT",
      publishToWeb: false,
      status: "OPEN",
      contactName: name,
      contactValue: contact,
      schoolId: schoolId ?? undefined,
    },
  });

  await logAudit({
    action: "PUBLIC_COMPLAINT",
    entity: "Notice",
    entityId: notice.id,
    details: { schoolId, schoolSlug: schoolSlug || null },
  });

  return NextResponse.json({
    ok: true,
    message: "Thank you. The school office has received your message.",
  });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session || !can(session.role, "MANAGE_NOTICES")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }

  const schoolId = await resolveSchoolId(session);
  const existing = await prisma.notice.findFirst({
    where: {
      id: parsed.data.id,
      audience: "COMPLAINT",
      ...schoolWhere(schoolId),
    },
  });
  if (!existing) {
    return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
  }

  const data: { status?: string; internalNote?: string | null } = {};
  if (parsed.data.status) data.status = parsed.data.status;
  if (parsed.data.internalNote !== undefined) {
    data.internalNote = parsed.data.internalNote.trim() || null;
  }

  const notice = await prisma.notice.update({
    where: { id: existing.id },
    data,
  });

  await logAudit({
    userId: session.userId,
    action: "UPDATE_COMPLAINT",
    entity: "Notice",
    entityId: notice.id,
    details: data,
  });

  return NextResponse.json({ notice });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session || !can(session.role, "MANAGE_NOTICES")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = DeleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const schoolId = await resolveSchoolId(session);
  const existing = await prisma.notice.findFirst({
    where: {
      id: parsed.data.id,
      audience: "COMPLAINT",
      ...schoolWhere(schoolId),
    },
  });
  if (!existing) {
    return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
  }

  await prisma.notice.delete({ where: { id: existing.id } });

  await logAudit({
    userId: session.userId,
    action: "DELETE_COMPLAINT",
    entity: "Notice",
    entityId: existing.id,
    details: { title: existing.title },
  });

  return NextResponse.json({ ok: true });
}
