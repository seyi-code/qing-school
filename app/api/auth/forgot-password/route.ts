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

const GENERIC = {
  ok: true,
  message:
    "If an account exists for that email, a reset link has been prepared. Check your email or ask your school admin.",
};

/**
 * Always prefer a JSON response (never empty 500) so the UI can show a real message.
 */
export async function POST(req: Request) {
  try {
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

    let user: { id: string; schoolId: string | null; isActive: boolean } | null = null;
    try {
      user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, schoolId: true, isActive: true },
      });
    } catch (e) {
      console.error("[forgot-password] user lookup failed", e);
      return NextResponse.json(GENERIC);
    }

    if (!user || !user.isActive) {
      return NextResponse.json(GENERIC);
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    try {
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
      await prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt },
      });
    } catch (e) {
      console.error("[forgot-password] PasswordResetToken table missing or write failed", e);
      return NextResponse.json(
        {
          error:
            "Password reset is not fully set up on this database. Ask the platform admin to run: CREATE TABLE for PasswordResetToken (see docs), or prisma db push on the preview DB.",
          code: "RESET_TOKEN_TABLE",
        },
        { status: 503 }
      );
    }

    const base =
      (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "") ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
    const resetPath = `/account/reset-password?token=${rawToken}`;
    const resetUrl = base ? `${base}${resetPath}` : resetPath;

    let emailStatus = "LOGGED_NO_PROVIDER";
    if (isEmailConfigured()) {
      const textBody = [
        "You requested a password reset for Qing School.",
        "",
        "Open this link within 1 hour:",
        resetUrl,
        "",
        "If you did not request this, ignore this email.",
      ].join("\n");

      const sent = await sendEmail({
        to: email,
        subject: "Reset your Qing School password",
        text: textBody,
        html: `<p>You requested a password reset for <strong>Qing School</strong>.</p>
<p><a href="${resetUrl}">Reset password</a> (valid 1 hour)</p>
<p style="color:#666;font-size:12px">If you did not request this, ignore this email.</p>`,
      });
      emailStatus = sent.ok ? `SENT_${sent.provider}` : `FAIL_${sent.provider || "email"}`;
      if (!sent.ok) {
        console.error("[forgot-password] email failed", sent.error);
      }
    }

    try {
      await prisma.messageLog.create({
        data: {
          channel: "EMAIL",
          recipient: email,
          body: `Password reset link (valid 1 hour): ${resetUrl}`,
          status: emailStatus,
        },
      });
    } catch (e) {
      console.error("[forgot-password] messageLog failed", e);
    }

    try {
      await logAudit({
        userId: user.id,
        schoolId: user.schoolId,
        action: "PASSWORD_RESET_REQUEST",
        entity: "User",
        entityId: user.id,
        details: { emailStatus },
      });
    } catch (e) {
      console.error("[forgot-password] audit failed", e);
    }

    // Staging convenience: always return path when email did not send
    const exposePath =
      process.env.RESET_DEBUG === "true" ||
      process.env.NODE_ENV === "development" ||
      emailStatus.startsWith("FAIL_") ||
      emailStatus === "LOGGED_NO_PROVIDER";

    if (exposePath) {
      return NextResponse.json({
        ...GENERIC,
        debugResetPath: resetPath,
        emailStatus,
        note:
          emailStatus.startsWith("SENT_")
            ? undefined
            : "Email not delivered yet — use the debug link below, or check Resend (domain/recipient limits).",
      });
    }

    return NextResponse.json(GENERIC);
  } catch (e) {
    console.error("[forgot-password] unexpected", e);
    return NextResponse.json(
      {
        error: "Could not process reset request. Try again or contact support.",
        detail: e instanceof Error ? e.message : "unknown",
      },
      { status: 500 }
    );
  }
}
