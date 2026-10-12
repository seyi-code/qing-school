"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

export function EnableStudentPortalButton({
  studentId,
  hasPortal,
  defaultEmail = "",
}: {
  studentId: string;
  hasPortal: boolean;
  defaultEmail?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/students/${studentId}/portal-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), temporaryPassword: password }),
      });
      const data = await res.json().catch(() => ({}));
      setBusy(false);
      if (!res.ok) {
        setMsg(data.error || "Failed");
        toast(data.error || "Failed", "error");
        return;
      }
      toast(data.message || "Portal access enabled", "success");
      setMsg(data.message || "Enabled");
      setOpen(false);
      setPassword("");
      router.refresh();
    } catch {
      setBusy(false);
      setMsg("Network error");
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs sm:text-sm border border-navy text-navy px-3 py-1.5 hover:bg-navy hover:text-paper"
      >
        {hasPortal ? "Reset student portal login" : "Enable student portal login"}
      </button>
      {open && (
        <form onSubmit={onSubmit} className="ledger-block space-y-2 text-sm max-w-md">
          <p className="text-xs text-ink/60">
            Creates a STUDENT login (email + temporary password). Student signs in at /login and is
            sent to the student portal. Use guardian email if the student has none.
          </p>
          <label className="block">
            Login email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full border border-line px-3 py-2"
            />
          </label>
          <label className="block">
            Temporary password
            <input
              type="text"
              required
              minLength={10}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 10, upper, lower, number, symbol"
              className="mt-1 w-full border border-line px-3 py-2 font-mono text-xs"
            />
          </label>
          {msg && <p className="text-xs text-ink/70">{msg}</p>}
          <button
            type="submit"
            disabled={busy}
            className="bg-navy text-paper px-3 py-1.5 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save portal access"}
          </button>
        </form>
      )}
    </div>
  );
}
