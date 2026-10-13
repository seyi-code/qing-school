"use client";

import { useMemo, useState } from "react";

type SchoolOpt = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  subscriptionStatus: string;
  planRenewsAt: string | null;
};

export function PlatformTrialForm({ schools }: { schools: SchoolOpt[] }) {
  const [schoolId, setSchoolId] = useState(schools[0]?.id || "");
  const [extendDays, setExtendDays] = useState(14);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const selected = useMemo(
    () => schools.find((s) => s.id === schoolId),
    [schools, schoolId]
  );

  async function run(action: "start_trial" | "extend_trial" | "end_trial") {
    if (!schoolId) return;
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/platform/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          schoolId,
          days: action === "end_trial" ? undefined : extendDays,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Failed");
        return;
      }
      setMsg(data.message || "Updated.");
      window.location.reload();
    } catch {
      setMsg("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (!schools.length) return null;

  const status = (selected?.subscriptionStatus || "NONE").toUpperCase();
  const ends = selected?.planRenewsAt
    ? new Date(selected.planRenewsAt).toLocaleDateString("en-NG", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div className="ledger-block space-y-3 text-sm">
      <h2 className="font-serif text-lg text-navy">Trial period</h2>
      <p className="text-ink/60 text-xs">
        New schools get a trial on onboard. Use this to start, extend, or end trial access without
        Paystack.
      </p>

      <label className="block">
        <span className="text-xs text-ink/50">School</span>
        <select
          className="w-full border border-line px-3 py-2 mt-1 bg-white rounded-lg"
          value={schoolId}
          onChange={(e) => setSchoolId(e.target.value)}
        >
          {schools.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.slug}) — {s.subscriptionStatus || "NONE"}
            </option>
          ))}
        </select>
      </label>

      {selected && (
        <p className="text-xs text-ink/55">
          Current: <strong>{status}</strong>
          {ends ? (
            <>
              {" "}
              · {status === "TRIAL" ? "Ends" : "Renews"} {ends}
            </>
          ) : null}
        </p>
      )}

      <label className="block max-w-[12rem]">
        <span className="text-xs text-ink/50">Days (start / extend)</span>
        <input
          type="number"
          min={1}
          max={90}
          className="w-full border border-line px-3 py-2 mt-1 rounded-lg"
          value={extendDays}
          onChange={(e) => setExtendDays(Math.min(90, Math.max(1, Number(e.target.value) || 1)))}
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => run("start_trial")}
          className="btn-primary disabled:opacity-60"
        >
          {loading ? "Working…" : "Start / reset trial"}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => run("extend_trial")}
          className="btn-ghost disabled:opacity-60"
        >
          Extend trial
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => run("end_trial")}
          className="btn-ghost !text-ink/70 disabled:opacity-60"
          title="Mark as MANUAL (no trial expiry) — school stays active"
        >
          End trial → paid/manual
        </button>
      </div>
      {msg && <p className="text-xs text-ink/70">{msg}</p>}
    </div>
  );
}
