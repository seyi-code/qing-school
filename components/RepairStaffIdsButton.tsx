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
    <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2.5 text-sm">
      <p className="text-xs text-amber-900/80 mb-2">
        Legacy IDs like <strong>FS-STF-0001</strong> can be fixed to this school's prefix (e.g.{" "}
        <strong>KMS-STF-0001</strong>).
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={run}
        className="bg-navy text-paper text-xs font-medium px-3 py-2 rounded-lg disabled:opacity-60"
      >
        {busy ? "Repairing…" : "Repair staff IDs for this school"}
      </button>
      {msg ? <p className="text-xs text-ink/70 mt-2">{msg}</p> : null}
    </div>
  );
}
