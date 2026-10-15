"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { passwordPolicyHint } from "@/lib/password-policy";
import { useToast } from "@/components/ui/Toast";
import { PasswordInput } from "@/components/ui/PasswordInput";

export function ChangePasswordForm({
  forceMode = false,
  afterSuccessPath,
}: {
  forceMode?: boolean;
  afterSuccessPath?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    setOk(false);
    const fd = new FormData(e.currentTarget);
    const currentPassword = String(fd.get("currentPassword") || "");
    const newPassword = String(fd.get("newPassword") || "");
    const confirmPassword = String(fd.get("confirmPassword") || "");

    if (newPassword !== confirmPassword) {
      setMsg("New password and confirmation do not match.");
      toast("Passwords do not match.", "error");
      setBusy(false);
      return;
    }

    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      const err = data.error || "Failed";
      setMsg(err);
      toast(err, "error");
      return;
    }
    setOk(true);
    setMsg("Password changed successfully.");
    toast("Password changed successfully.", "success");
    (e.target as HTMLFormElement).reset();
    if (forceMode || afterSuccessPath) {
      const dest = data.redirectTo || afterSuccessPath || "/dashboard";
      setTimeout(() => {
        router.push(dest);
        router.refresh();
      }, 900);
    }
  }

  const inputClass = "mt-1 w-full border border-line px-3 py-2 rounded-lg";

  return (
    <form onSubmit={onSubmit} className="space-y-3 text-sm max-w-md">
      <p className="text-xs text-ink/60">{passwordPolicyHint()}</p>
      {ok && (
        <p className="text-sm text-sage border border-sage/40 bg-sage/10 px-3 py-2">
          {msg || "Password changed successfully."}
        </p>
      )}
      {!ok && msg && (
        <p className="text-sm text-brick border border-brick/30 bg-brick/5 px-3 py-2">{msg}</p>
      )}
      <label className="block">
        {forceMode ? "Temporary / current password" : "Current password"}
        <PasswordInput
          name="currentPassword"
          required
          autoComplete="current-password"
          className={inputClass}
        />
      </label>
      <label className="block">
        New password
        <PasswordInput
          name="newPassword"
          required
          autoComplete="new-password"
          className={inputClass}
        />
      </label>
      <label className="block">
        Confirm new password
        <PasswordInput
          name="confirmPassword"
          required
          autoComplete="new-password"
          className={inputClass}
        />
      </label>
      <button
        type="submit"
        disabled={busy || ok}
        className="bg-navy text-paper px-4 py-2 disabled:opacity-50 rounded-lg"
      >
        {busy ? "Saving..." : ok ? "Saved" : forceMode ? "Save and continue" : "Change password"}
      </button>
    </form>
  );
}
