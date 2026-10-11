/**
 * Transactional email (password reset).
 *
 * Set on Vercel:
 *   RESEND_API_KEY=re_xxxx
 *   EMAIL_FROM="Qing School <onboarding@resend.dev>"
 *   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
 *
 * Get a free key at https://resend.com
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
    "Qing School <onboarding@resend.dev>"
  );
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/** Best-effort send via Resend HTTP API. Does not throw. */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return {
      ok: false,
      error: "RESEND_API_KEY not set",
      provider: "none",
    };
  }

  try {
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
        html:
          input.html ||
          `<pre style="font-family:sans-serif;white-space:pre-wrap">${escapeHtml(input.text)}</pre>`,
      }),
    });

    const json = (await res.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
    };

    if (!res.ok) {
      return {
        ok: false,
        provider: "resend",
        error: json.message || `Resend HTTP ${res.status}`,
      };
    }

    return { ok: true, provider: "resend", id: json.id };
  } catch (e) {
    return {
      ok: false,
      provider: "resend",
      error: e instanceof Error ? e.message : "Network error sending email",
    };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
