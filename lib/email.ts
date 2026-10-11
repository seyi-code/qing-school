/**
 * Transactional email for SaaS (password reset, notices later).
 *
 * Providers (first match wins):
 * 1. RESEND_API_KEY  — https://resend.com (recommended on Vercel)
 * 2. SMTP_* via optional nodemailer if installed (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
 *
 * Always set:
 *   EMAIL_FROM="Qing School <noreply@yourdomain.com>"
 *   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
 */

export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type SendEmailResult =
  | { ok: true; provider: string; id?: string }
  | { ok: false; error: string; provider?: string };

function fromAddress(): string {
  return (
    process.env.EMAIL_FROM ||
    process.env.SMTP_FROM ||
    "Qing School <noreply@qing.school>"
  );
}

async function sendViaResend(input: SendEmailInput): Promise<SendEmailResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "RESEND_API_KEY not set", provider: "resend" };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: [input.to],
      subject: input.subject,
      text: input.text,
      html: input.html || `<pre style="font-family:sans-serif">${input.text}</pre>`,
    }),
  });

  const json = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!res.ok) {
    return {
      ok: false,
      provider: "resend",
      error: json.message || `Resend HTTP ${res.status}`,
    };
  }
  return { ok: true, provider: "resend", id: json.id };
}

/** Best-effort send. Does not throw. */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (process.env.RESEND_API_KEY) {
    return sendViaResend(input);
  }

  if (process.env.SMTP_HOST) {
    // Optional: install nodemailer for classic SMTP (Gmail/Zoho).
    try {
      // Dynamic require so build succeeds without the package.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const nodemailer = require("nodemailer") as typeof import("nodemailer");
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true",
        auth:
          process.env.SMTP_USER && process.env.SMTP_PASS
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
      });
      const info = await transporter.sendMail({
        from: fromAddress(),
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      });
      return { ok: true, provider: "smtp", id: String(info.messageId || "") };
    } catch (e) {
      return {
        ok: false,
        provider: "smtp",
        error:
          e instanceof Error
            ? e.message
            : "SMTP failed (install nodemailer or use RESEND_API_KEY)",
      };
    }
  }

  return {
    ok: false,
    error: "No email provider configured (set RESEND_API_KEY or SMTP_HOST)",
  };
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY || process.env.SMTP_HOST);
}
