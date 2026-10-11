import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { checkRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { isEmailConfigured, sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const Schema = z.object({
  email: z.string().email(),
});

function clientIp(req: Request): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "unknown";
}

/**
 * Always returns the same generic message to avoid email enumeration.
 * When RESEND_API_KEY or SMTP is set, sends a real reset link.
 * RESET_DEBUG=true may include resetPath (staging only).
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const key = rateLimitKey(clientIp(req), `reset:${email}`);
  const limited = checkRateLimit(key, { max: 5, windowMs: 15 * 60 * 1000 });
  if (!limited.ok) {
    return NextResponse.json(
      { error: `Too many reset requests. Try again in ${limited.retryAfterSec}s.` },
      { status: 429 }
    );
  }

  const generic = {
    ok: true,
    message:
      "If an account exists for that email, a reset link has been prepared. Check your email or ask your school admin.",
  };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    return NextResponse.json(generic);
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  const base =
    (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  const resetPath = `/account/reset-password?token=${rawToken}`;
  const resetUrl = base ? `${base}${resetPath}` : resetPath;

  let emailStatus = "LOGGED_NO_PROVIDER";
  if (isEmailConfigured()) {
    const sent = await sendEmail({
      to: email,
      subject: "Reset your Qing School password",
      text: [
        "You requested a password reset for Qing School.",
        "",
        `Open this link within 1 hour:",
        resetUrl,
        "",
        "If you did not request this, ignore this email.",
      ].join("\n"),
      html: `<p>You requested a password reset for <strong>Qing School</strong>.</p>
<p><a href="${resetUrl}">Reset password</a> (valid 1 hour)</p>
<p style="color:#666;font-size:12px">If you did not request this, ignore this email.</p>`,
    });
    emailStatus = sent.ok ? `SENT_${sent.provider}` : `FAIL_${sent.provider || "email"}`;
    if (!sent.ok) {
      console.error("[forgot-password] email failed", sent.error);
    }
  }

  await prisma.messageLog.create({
    data: {
      channel: "EMAIL",
      recipient: email,
      body: `Password reset link (valid 1 hour): ${resetUrl}`,
      status: emailStatus,
    },
  });

  await logAudit({
    userId: user.id,
    schoolId: user.schoolId,
    action: "PASSWORD_RESET_REQUEST",
    entity: "User",
    entityId: user.id,
    details: { emailStatus },
  });

  const debug =
    process.env.RESET_DEBUG === "true" || process.env.NODE_ENV === "development";

  if (debug) {
    return NextResponse.json({
      ...generic,
      debugResetPath: resetPath,
      emailStatus,
      note: "RESET_DEBUG: remove in production. Configure RESEND_API_KEY or SMTP for real email.",
    });
  }

  return NextResponse.json(generic);
}
