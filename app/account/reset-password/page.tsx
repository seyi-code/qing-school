"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { PasswordInput } from "@/components/ui/PasswordInput";

/**
 * Token-based reset (forgot password).
 * Does NOT ask for current password — user already proved ownership via email token.
 * Asks: new password + confirm only.
 */
function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const { toast } = useToast();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!token) {
      setError("Missing reset token. Use the link from your email.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.error || "Could not reset password.";
        setError(msg);
        toast(msg, "error");
        setLoading(false);
        return;
      }
      setSuccess("Password updated. You can sign in now.");
      toast("Password updated.", "success");
      setTimeout(() => router.push("/login?reset=ok"), 1200);
    } catch {
      setError("Network error. Try again.");
      toast("Network error.", "error");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-paper flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md ledger-block space-y-4">
        <h1 className="font-serif text-xl">Choose a new password</h1>
        <p className="text-sm text-ink/60">
          Enter a new password and confirm it. You do not need your old password here.
        </p>
        {error && (
          <p className="text-sm text-brick border border-brick/30 bg-brick/5 px-3 py-2">{error}</p>
        )}
        {success && (
          <p className="text-sm text-sage border border-sage/40 bg-sage/10 px-3 py-2">{success}</p>
        )}
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block text-sm">
            New password
            <PasswordInput
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password (min 8)"
              className="mt-1 w-full border border-line px-3 py-2.5 text-sm"
              autoComplete="new-password"
              disabled={!!success}
            />
          </label>
          <label className="block text-sm">
            Confirm password
            <PasswordInput
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm password"
              className="mt-1 w-full border border-line px-3 py-2.5 text-sm"
              autoComplete="new-password"
              disabled={!!success}
            />
          </label>
          <button
            type="submit"
            disabled={loading || !!success}
            className="w-full bg-navy text-paper py-2.5 text-sm disabled:opacity-60"
          >
            {loading ? "Saving…" : success ? "Done" : "Update password"}
          </button>
        </form>
        <Link href="/login" className="text-xs text-navy underline block text-center">
          ← Sign in
        </Link>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-paper" />}>
      <ResetForm />
    </Suspense>
  );
}
