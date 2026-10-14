"use client";

import { useState } from "react";

type ProbeSchool = {
  slug: string;
  name: string;
  shortName: string;
  students: number;
  staff: number;
  classes: number;
  arms: number;
  invoices: number;
  payments: number;
  notices: number;
  sampleAdmissions: string[];
  prefixMismatches: number;
};

type ProbeResult = {
  ok: boolean;
  schoolCount: number;
  schools: ProbeSchool[];
  orphans: { students: number; staff: number; classes: number };
  warnings: string[];
  checklist: string[];
  checkedAt: string;
};

/** Platform-only isolation health check card. */
export function IsolationProbeCard() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProbeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/platform/isolation-probe");
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "Probe failed");
        setData(null);
        return;
      }
      setData(json as ProbeResult);
    } catch {
      setError("Network error running probe");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="ledger-block space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-serif text-lg text-navy">Isolation probe</h2>
          <p className="text-xs text-ink/55">
            Per-school counts + orphan check. Run after onboarding a second school.
          </p>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="btn-primary disabled:opacity-60"
        >
          {loading ? "Running…" : "Run isolation probe"}
        </button>
      </div>

      {error && (
        <p className="text-sm text-brick border border-brick/30 bg-brick/5 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      {data && (
        <div className="space-y-3 text-sm">
          <p className={data.ok ? "text-sage font-medium" : "text-gold-dark font-medium"}>
            {data.ok
              ? `✓ Probe OK — ${data.schoolCount} schools, no orphans`
              : `⚠ Review warnings — ${data.schoolCount} school(s)`}
            <span className="text-ink/40 font-normal text-xs ml-2">{data.checkedAt}</span>
          </p>

          {data.warnings.length > 0 && (
            <ul className="text-xs text-brick space-y-1 list-disc pl-4">
              {data.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}

          <div className="table-wrap">
            <table className="ledger text-xs">
              <thead>
                <tr>
                  <th>School</th>
                  <th>Students</th>
                  <th>Staff</th>
                  <th>Classes</th>
                  <th>Arms</th>
                  <th>Invoices</th>
                  <th>Payments</th>
                  <th>Sample admissions</th>
                </tr>
              </thead>
              <tbody>
                {data.schools.map((s) => (
                  <tr key={s.slug}>
                    <td>
                      <span className="font-medium">{s.name}</span>
                      <span className="block text-ink/40">{s.slug}</span>
                    </td>
                    <td>{s.students}</td>
                    <td>{s.staff}</td>
                    <td>{s.classes}</td>
                    <td>{s.arms}</td>
                    <td>{s.invoices}</td>
                    <td>{s.payments}</td>
                    <td className="font-mono max-w-[12rem] truncate">
                      {s.sampleAdmissions.join(", ") || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <p className="text-xs font-medium text-ink/60 mb-1">Manual checklist</p>
            <ul className="text-xs text-ink/70 list-decimal pl-4 space-y-0.5">
              {data.checklist.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>

          {(data.orphans.students > 0 || data.orphans.staff > 0 || data.orphans.classes > 0) && (
            <p className="text-xs text-brick">
              Orphans: students={data.orphans.students}, staff={data.orphans.staff}, classes=
              {data.orphans.classes}. Run backfill / assign schoolId before production.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
