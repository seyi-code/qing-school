import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import { SCHOOL } from "@/lib/school-config";

const Schema = z.object({
  email: z.string().email().max(200),
  source: z.string().max(50).optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const source = parsed.data.source || "website";

  try {
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existing) {
      if (!existing.isActive) {
        await prisma.newsletterSubscriber.update({
          where: { id: existing.id },
          data: { isActive: true, source },
        });
      }
      return NextResponse.json({
        ok: true,
        message: "You're already on the list — welcome back!",
      });
    }

    await prisma.newsletterSubscriber.create({
      data: { email, source, schoolId: null },
    });

    if (isEmailConfigured()) {
      void sendEmail({
        to: email,
        subject: `Welcome to the ${SCHOOL.shortName} newsletter`,
        text: `Thank you for subscribing to updates from ${SCHOOL.name}.\n\nYou'll receive school notices, event reminders and important announcements.\n\n${SCHOOL.motto}\n${SCHOOL.contact.phone} · ${SCHOOL.contact.email}`,
        html: `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1c2230">
          <h1 style="font-size:1.25rem;color:#12345a">Welcome to the ${SCHOOL.shortName} newsletter</h1>
          <p>Thank you for subscribing to updates from <strong>${SCHOOL.name}</strong>.</p>
          <p>You'll receive school notices, event reminders and important announcements.</p>
          <p style="color:#627184;font-size:0.875rem;margin-top:24px">${SCHOOL.motto}<br/>${SCHOOL.contact.phone} · ${SCHOOL.contact.email}</p>
        </div>`,
      }).catch(() => {});
    }

    return NextResponse.json({
      ok: true,
      message: "Thanks for subscribing! Check your inbox for a welcome note.",
    });
  } catch (err) {
    console.error("[newsletter]", err);
    return NextResponse.json(
      { error: "Could not save your subscription. Please try again later." },
      { status: 500 }
    );
  }
}
