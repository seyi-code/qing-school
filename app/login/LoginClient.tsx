"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Branding } from "@/lib/branding";
import { useToast } from "@/components/ui/Toast";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export function LoginClient({
  branding,
  schoolSlug,
}: {
  branding: Branding;
  schoolSlug: string | null;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f7f5ef]" />}>
      <LoginForm branding={branding} schoolSlug={schoolSlug} />
    </Suspense>
  );
}

function LoginForm({
  branding,
  schoolSlug,
}: {
  branding: Branding;
  schoolSlug: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const resetOk = searchParams.get("reset") === "ok";
  const { toast } = useToast();
  const homeHref = schoolSlug ? `/site/${schoolSlug}` : "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          (typeof data.error === "string" && data.error) ||
          (res.status === 503
            ? "Server configuration error. Check Vercel env (DATABASE_URL, SESSION_SECRET)."
            : res.status === 429
              ? "Too many attempts. Wait and try again."
              : `Login failed (${res.status}).`);
        setError(msg);
        toast(msg, "error");
        setLoading(false);
        return;
      }
      toast("Signed in.", "success");
      const dest = data.redirectTo || nextParam || "/dashboard";
      router.push(dest);
      router.refresh();
    } catch {
      const msg = "Network error. Try again.";
      setError(msg);
      toast(msg, "error");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f5ef] text-[#1e2e43] flex flex-col">
      <MarketingNav brand={branding} schoolSlug={schoolSlug} />
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-white border border-[#e3e8ed] rounded-2xl p-6 sm:p-8 shadow-sm">
          <p className="text-xs font-extrabold tracking-[0.16em] uppercase text-[#a57d13]">
            {branding.shortName || branding.name} portal
          </p>
          <h1 className="font-serif text-2xl text-[#12345a] mt-1 mb-1">Sign in</h1>
          <p className="text-sm text-[#627184] mb-6">
            Staff, parent and student access for {branding.name}.
          </p>

          {resetOk && (
            <p className="text-sm text-sage border border-sage/30 rounded-lg px-3 py-2 mb-4">
              Password updated. Sign in with your new password.
            </p>
          )}

          {error && (
            <p className="text-sm text-brick border border-brick/30 rounded-lg px-3 py-2 mb-4">{error}</p>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-xs uppercase text-[#627184] mb-1" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-[#e3e8ed] bg-white px-3 py-2.5 text-sm rounded-lg focus:border-[#12345a] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase text-[#627184] mb-1" htmlFor="password">
                Password
              </label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full border border-[#e3e8ed] bg-white px-3 py-2.5 text-sm rounded-lg focus:border-[#12345a] outline-none"
              />
            </div>
            <div className="text-right">
              <Link
                href="/account/forgot-password"
                className="text-xs text-[#12345a] underline font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-navy text-paper py-3 text-sm font-semibold hover:bg-navy-light disabled:opacity-60 shadow-sm transition-colors"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-center text-xs text-ink/45 mt-6 space-y-1">
            <span className="block">Staff, parent and student portal.</span>
            <Link href={homeHref} className="text-navy/80 hover:text-navy font-medium">
              ← Back to public site
            </Link>
          </p>
        </div>
      </div>
      <MarketingFooter brand={branding} schoolSlug={schoolSlug} />
    </main>
  );
}
