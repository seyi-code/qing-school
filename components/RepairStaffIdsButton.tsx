"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RepairStaffIdsButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function run() {
    if (
      !window.confirm(
        "Re-number staff IDs for this school to SHORT-STF-0001 style (e.g. KMS-STF-0001)? Legacy FS- codes will be updated."
      )
    ) {
      return;
    }
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "repairStaffIds" }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error || "Repair failed");
      return;
    }
    setMsg(`Updated ${data.fixed ?? 0} staff ID(s).`);
    router.refresh();
  }

  return (
    <div className="text-sm">
      <button
        type="button"
        disabled={busy}
        onClick={run}
        className="btn-ghost !text-xs disabled:opacity-60"
      >
        {busy ? "Repairing…" : "Repair staff IDs for this school"}
      </button>
      {msg ? <p className="text-xs text-ink/60 mt-1">{msg}</p> : null}
    </div>
  );
}
