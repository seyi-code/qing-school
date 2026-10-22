"use client";

import { useMemo, useState } from "react";
import { PLAN_STUDENT_CAPS } from "@/lib/plan-caps";

type SchoolOpt = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  maxStudents?: number;
};

function formatCap(n: number) {
  return n.toLocaleString("en-US");
}

export function PlatformBillingForm({ schools }: { schools: SchoolOpt[] }) {
  const [schoolId, setSchoolId] = useState(schools[0]?.id || "");
  const [plan, setPlan] = useState<"STARTER" | "PRO" | "ENTERPRISE">("PRO");
  const [customCap, setCustomCap] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const selected = useMemo(
    () => schools.find((s) => s.id === schoolId),
    [schools, schoolId]
  );

  function onSchoolChange(id: string) {
    setSchoolId(id);
    const s = schools.find((x) => x.id === id);
    if (s?.plan === "STARTER" || s?.plan === "PRO" || s?.plan === "ENTERPRISE") {
      setPlan(s.plan);
    }
    if (typeof s?.maxStudents === "number") {
      setCustomCap(String(s.maxStudents));
    }
  }

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/platform/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "subscribe", schoolId, plan, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Failed");
        return;
      }
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
        return;
      }
      setMsg(data.message || "Plan applied (mock or manual).");
    } catch {
      setMsg("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function setPlanOnly() {
    setLoading(true);
    setMsg("");
    try {
      const payload: {
        schoolId: string;
        plan: string;
        maxStudents?: number;
      } = { schoolId, plan };
      const n = Number(customCap);
      if (customCap.trim() && Number.isFinite(n) && n >= 1) {
        payload.maxStudents = Math.floor(n);
      }
      const res = await fetch("/api/platform/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Failed");
        return;
      }
      setMsg(
        `Updated ${data.school.name}: ${data.school.plan} · max ${data.school.maxStudents} students`
      );
    } catch {
      setMsg("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (!schools.length) return null;

  return (
    <form onSubmit={subscribe} className="ledger-block space-y-3 text-sm">
      <h2 className="font-serif text-lg text-navy">Edit tenant · plan & student cap</h2>
      <p className="text-ink/60 text-xs">
        Change plan or set a custom student cap (e.g. full capacity) with{" "}
        <strong>Set limits only</strong> — no charge. Paystack subscribe is optional when keys exist.
      </p>
      <label className="block">
        <span className="text-xs text-ink/50">School</span>
        <select
          className="w-full border border-line px-3 py-2 mt-1 rounded-lg bg-white"
          value={schoolId}
          onChange={(e) => onSchoolChange(e.target.value)}
        >
          {schools.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.slug}) — {s.plan}
              {typeof s.maxStudents === "number" ? ` · cap ${s.maxStudents}` : ""}
            </option>
          ))}
        </select>
      </label>
      {selected ? (
        <p className="text-[11px] text-ink/50">
          Current: <span className="font-medium text-ink/70">{selected.plan}</span>
          {typeof selected.maxStudents === "number"
            ? ` · ${formatCap(selected.maxStudents)} students`
            : ""}
        </p>
      ) : null}
      <label className="block">
        <span className="text-xs text-ink/50">Plan</span>
        <select
          className="w-full border border-line px-3 py-2 mt-1 rounded-lg bg-white"
          value={plan}
          onChange={(e) => {
            const p = e.target.value as typeof plan;
            setPlan(p);
            setCustomCap(String(PLAN_STUDENT_CAPS[p]));
          }}
        >
          <option value="STARTER">
            STARTER — {formatCap(PLAN_STUDENT_CAPS.STARTER)} students
          </option>
          <option value="PRO">PRO — {formatCap(PLAN_STUDENT_CAPS.PRO)} students</option>
          <option value="ENTERPRISE">
            ENTERPRISE — {formatCap(PLAN_STUDENT_CAPS.ENTERPRISE)} students
          </option>
        </select>
      </label>
      <label className="block">
        <span className="text-xs text-ink/50">
          Student cap (optional override — leave blank to use plan default)
        </span>
        <input
          type="number"
          min={1}
          max={100000}
          className="w-full border border-line px-3 py-2 mt-1 rounded-lg bg-white"
          value={customCap}
          onChange={(e) => setCustomCap(e.target.value)}
          placeholder={`e.g. ${PLAN_STUDENT_CAPS[plan]}`}
        />
      </label>
      <label className="block">
        <span className="text-xs text-ink/50">Billing email (only for Paystack subscribe)</span>
        <input
          type="email"
          className="w-full border border-line px-3 py-2 mt-1 rounded-lg bg-white"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@school.ng"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={setPlanOnly}
          className="btn-primary disabled:opacity-60"
        >
          {loading ? "Working…" : "Set plan / cap (no charge)"}
        </button>
        <button
          type="submit"
          disabled={loading || !email}
          className="btn-ghost disabled:opacity-60"
        >
          Start Paystack subscription
        </button>
      </div>
      {msg && <p className="text-xs text-ink/70">{msg}</p>}
    </form>
  );
}
