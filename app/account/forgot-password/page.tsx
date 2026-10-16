"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { SCHOOL } from "@/lib/school-config";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [debugPath, setDebugPath] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setDebugPath("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          data.error ||
          data.detail ||
          (res.status === 503
            ? "Reset not ready on database — contact platform admin."
            : `Request failed (${res.status})`);
        setError(msg);
        setLoading(false);
        return;
      }
      const parts = [
        data.message || "If that account exists, instructions were sent.",
        data.note,
        data.emailStatus ? `Status: ${data.emailStatus}` : null,
        data.emailError ? `Resend: ${data.emailError}` : null,
        data.emailFrom ? `From: ${data.emailFrom}` : null,
      ].filter(Boolean);
      setMessage(parts.join("\n"));
      if (data.debugResetPath) setDebugPath(data.debugResetPath);
    } catch {
      setError("Network error");
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#f7f5ef] flex flex-col">
      <MarketingNav />
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-white border border-[#e3e8ed] rounded-2xl p-5 space-y-4 shadow-sm">
          <h1 className="font-serif text-xl text-ink">Reset password</h1>
          <p className="text-sm text-ink/60">
            Enter the email for your {SCHOOL.shortName} portal account.
          </p>
          {error && (
            <p className="text-sm text-brick border border-brick/30 bg-brick/5 px-3 py-2 whitespace-pre-wrap">
              {error}
            </p>
          )}
          {message && (
            <p className="text-sm text-navy border border-navy/20 bg-navy/5 px-3 py-2 whitespace-pre-wrap">
              {message}
            </p>
          )}
          {debugPath && (
            <p className="text-xs break-all">
              Debug link:{" "}
              <Link href={debugPath} className="text-navy underline">
                {debugPath}
              </Link>
            </p>
          )}
          <form onSubmit={onSubmit} className="space-y-3">
            <label className="block text-sm">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full border border-[#e3e8ed] px-3 py-2.5 text-sm rounded-lg"
                autoComplete="email"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#12345a] text-white py-3 text-sm font-semibold disabled:opacity-60"
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
          <Link href="/login" className="text-xs text-navy underline block text-center">
            ← Back to sign in
          </Link>
        </div>
      </div>
      <MarketingFooter />
    </main>
  );
}
