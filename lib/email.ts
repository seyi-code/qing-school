/**
 * Transactional email via Resend.
 *
 * Vercel env:
 *   RESEND_API_KEY=re_xxxx
 *   EMAIL_FROM="Qing School <onboarding@resend.dev>"   ← use this until your domain is verified
 *   NEXT_PUBLIC_APP_URL=https://qing-school-staging.vercel.app
 */

export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type SendEmailResult =
  | { ok: true; provider: string; id?: string; from?: string }
  | { ok: false; error: string; provider?: string; from?: string };

/** Resend allows onboarding@resend.dev without a verified domain. */
const SAFE_FROM = "Qing School <onboarding@resend.dev>";

function fromAddress(): string {
  const raw = (process.env.EMAIL_FROM || process.env.SMTP_FROM || "").trim();
  if (!raw) return SAFE_FROM;

  // Must look like "Name <email@domain>" or "email@domain"
  const angle = raw.match(/<([^>]+)>/);
  const addr = (angle ? angle[1] : raw).trim().toLowerCase();

  // Only allow onboarding@resend.dev or a clearly custom domain (not gmail as From)
  if (addr === "onboarding@resend.dev") {
    return raw.includes("<") ? raw : `Qing School <${addr}>`;
  }
  if (addr.endsWith("@gmail.com") || addr.endsWith("@yahoo.com") || addr.endsWith("@outlook.com")) {
    // Resend will reject personal webmail as From without domain setup
    return SAFE_FROM;
  }
  // Custom domain — pass through (must be verified in Resend)
  return raw.includes("<") ? raw : `Qing School <${addr}>`;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    return { ok: false, error: "RESEND_API_KEY not set", provider: "none" };
  }

  const from = fromAddress();

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
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
      name?: string;
    };

    if (!res.ok) {
      const err =
        json.message ||
        json.name ||
        `Resend HTTP ${res.status}`;
      console.error("[email] Resend rejected", { from, to: input.to, status: res.status, err });
      return { ok: false, provider: "resend", error: err, from };
    }

    return { ok: true, provider: "resend", id: json.id, from };
  } catch (e) {
    return {
      ok: false,
      provider: "resend",
      error: e instanceof Error ? e.message : "Network error sending email",
      from,
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
