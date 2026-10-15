"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { PasswordInput } from "@/components/ui/PasswordInput";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const resetOk = searchParams.get("reset") === "ok";
  const { toast } = useToast();

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
    <main className="min-h-screen bg-gradient-to-b from-[#eef2f8] via-paper to-paper flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-7">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt=""
            className="w-16 h-16 object-contain mx-auto mb-3 rounded-full bg-white shadow-sm border border-line/60 p-1.5"
          />
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-navy/60 mb-1.5">
            School ERP · Multi-tenant
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl text-navy tracking-tight">Portal sign in</h1>
          <p className="text-sm text-ink/55 mt-2">Staff, parent & student access for your school</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="bg-white rounded-2xl border border-line/80 shadow-sm px-5 py-6 space-y-4"
        >
          {resetOk && (
            <p className="text-sm text-sage border border-sage/40 bg-sage/10 px-3 py-2 rounded-lg">
              Password updated. Sign in with your new password.
            </p>
          )}
          {error && (
            <p className="text-sm text-brick border border-brick/30 bg-brick/5 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <div>
            <label
              className="block text-xs font-medium uppercase tracking-wide text-ink/50 mb-1.5"
              htmlFor="email"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@school.edu.ng"
              className="w-full rounded-xl border border-line bg-paper/40 px-3.5 py-2.5 text-sm focus:border-navy focus:bg-white outline-none transition-colors"
            />
          </div>

          <div>
            <label
              className="block text-xs font-medium uppercase tracking-wide text-ink/50 mb-1.5"
              htmlFor="password"
            >
              Password
            </label>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-line bg-paper/40 px-3.5 py-2.5 text-sm focus:border-navy focus:bg-white outline-none transition-colors"
            />
          </div>

          <p className="text-right text-xs -mt-1">
            <Link
              href="/account/forgot-password"
              className="text-navy font-medium hover:text-gold no-underline"
            >
              Forgot password?
            </Link>
          </p>

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
          <Link href="/" className="text-navy/80 hover:text-navy font-medium">
            ← Back to public site
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-paper flex items-center justify-center text-sm text-ink/50">
          Loading…
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
