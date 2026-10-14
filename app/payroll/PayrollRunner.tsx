"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PayrollRunner() {
  const router = useRouter();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [deductionPercent, setDeductionPercent] = useState(5);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function run() {
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/payroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month, deductionPercent }),
    });
    const data = await res.json();
    setBusy(false);
    setOk(res.ok);
    setMessage(res.ok ? `Generated ${data.generated} payslip(s) for ${month}.` : data.error);
    if (res.ok) router.refresh();
  }

  return (
    <div className="rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 to-white p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-end gap-3 sm:gap-4">
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wide text-ink/50 mb-1">
            Month
          </label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wide text-ink/50 mb-1">
            Flat deduction %
          </label>
          <input
            type="number"
            value={deductionPercent}
            onChange={(e) => setDeductionPercent(Number(e.target.value))}
            className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm w-24"
          />
        </div>
        <button onClick={run} disabled={busy} className="btn-primary disabled:opacity-60">
          {busy ? "Running…" : "Run Payroll"}
        </button>
      </div>
      {message && (
        <p
          className={`text-sm rounded-lg px-3 py-2 ${
            ok
              ? "bg-emerald-100/80 text-emerald-900 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
