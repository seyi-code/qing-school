"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SettingsAdminForms() {
  const router = useRouter();
  const [year, setYear] = useState("2026/2027");
  const [makeCurrent, setMakeCurrent] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function createSession() {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/settings/academic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_session",
        name: year.trim(),
        makeCurrent,
        terms: ["First Term", "Second Term", "Third Term"],
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error || "Failed");
      return;
    }
    setMsg(`Created ${data.session?.name || year}`);
    router.refresh();
  }

  async function seedBands(replace: boolean) {
    if (
      replace &&
      !window.confirm("Replace all existing grade bands with the standard A–F scale?")
    ) {
      return;
    }
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/settings/academic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "seed_grade_bands", replace }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error || "Failed");
      return;
    }
    setMsg(`Grade bands ready (${data.bands?.length ?? 0})`);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="ledger-block space-y-2 text-sm">
        <h3 className="font-serif text-base m-0">Add academic year</h3>
        <p className="text-xs text-ink/55 m-0">
          Creates a session with First / Second / Third term. Tick current to make it the active year.
        </p>
        <label className="block">
          <span className="text-xs text-ink/50">Session name</span>
          <input
            className="w-full border border-line px-3 py-2 mt-1 rounded-lg"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="2026/2027"
          />
        </label>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={makeCurrent}
            onChange={(e) => setMakeCurrent(e.target.checked)}
          />
          Set as current academic year
        </label>
        <button
          type="button"
          disabled={busy || !year.trim()}
          onClick={createSession}
          className="btn-primary disabled:opacity-60"
        >
          {busy ? "Saving…" : "Add academic year"}
        </button>
      </div>

      <div className="ledger-block space-y-2 text-sm">
        <h3 className="font-serif text-base m-0">Grade bands</h3>
        <p className="text-xs text-ink/55 m-0">
          Used on report cards to turn totals into A–F grades and remarks. Seed the standard scale if
          none exist.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => seedBands(false)}
            className="btn-primary disabled:opacity-60"
          >
            Seed standard bands
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => seedBands(true)}
            className="btn-ghost disabled:opacity-60"
          >
            Replace with standard A–F
          </button>
        </div>
      </div>
      {msg ? <p className="text-xs text-ink/70">{msg}</p> : null}
    </div>
  );
}
