"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function WorkAsSchoolButton({
  schoolId,
  label = "Work as this school",
}: {
  schoolId: string;
  label?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    const res = await fetch("/api/platform/active-school", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schoolId }),
    });
    setBusy(false);
    if (!res.ok) {
      alert("Could not switch school context");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={run}
      disabled={busy}
      className="btn-ghost !px-2.5 !py-1 !text-[11px] disabled:opacity-50"
    >
      {busy ? "…" : label}
    </button>
  );
}
