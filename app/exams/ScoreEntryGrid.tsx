"use client";

import { useState } from "react";

interface Row {
  id: string;
  name: string;
  ca1: number;
  ca2: number;
  exam: number;
}

const CA1_MAX = 20;
const CA2_MAX = 20;
const EXAM_MAX = 60;

function fieldMax(field: "ca1" | "ca2" | "exam") {
  return field === "exam" ? EXAM_MAX : field === "ca1" ? CA1_MAX : CA2_MAX;
}

export function ScoreEntryGrid({
  armSubjectId,
  termId,
  students,
}: {
  armSubjectId: string;
  termId: string;
  students: Row[];
}) {
  const [rows, setRows] = useState<Row[]>(students);
  /** While typing, keep raw string so mobile can clear zeros and avoid leading-zero quirks */
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  const [studentFilter, setStudentFilter] = useState("");

  function draftKey(id: string, field: string) {
    return `${id}:${field}`;
  }

  function displayValue(id: string, field: "ca1" | "ca2" | "exam") {
    const k = draftKey(id, field);
    if (Object.prototype.hasOwnProperty.call(drafts, k)) return drafts[k];
    const n = rows.find((r) => r.id === id)?.[field] ?? 0;
    return String(n);
  }

  function onChange(id: string, field: "ca1" | "ca2" | "exam", raw: string) {
    setMsg("");
    setOk(false);
    const cleaned = raw.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
    setDrafts((d) => ({ ...d, [draftKey(id, field)]: cleaned }));
  }

  function commit(id: string, field: "ca1" | "ca2" | "exam") {
    const k = draftKey(id, field);
    if (!Object.prototype.hasOwnProperty.call(drafts, k)) return;
    const raw = drafts[k].trim();
    const max = fieldMax(field);
    let n = raw === "" ? 0 : Number(raw);
    if (!Number.isFinite(n)) n = 0;
    n = Math.max(0, Math.min(max, n));
    if (Number.isInteger(n)) n = Math.round(n);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: n } : r)));
    setDrafts((d) => {
      const next = { ...d };
      delete next[k];
      return next;
    });
  }

  async function save() {
    const open = { ...drafts };
    const nextRows = rows.map((r) => {
      let ca1 = r.ca1;
      let ca2 = r.ca2;
      let exam = r.exam;
      for (const field of ["ca1", "ca2", "exam"] as const) {
        const k = draftKey(r.id, field);
        if (Object.prototype.hasOwnProperty.call(open, k)) {
          const raw = open[k].trim();
          const max = fieldMax(field);
          let n = raw === "" ? 0 : Number(raw);
          if (!Number.isFinite(n)) n = 0;
          n = Math.max(0, Math.min(max, n));
          if (field === "ca1") ca1 = n;
          if (field === "ca2") ca2 = n;
          if (field === "exam") exam = n;
        }
      }
      return { ...r, ca1, ca2, exam };
    });
    setRows(nextRows);
    setDrafts({});

    setSaving(true);
    setMsg("");
    setOk(false);
    const res = await fetch("/api/exams/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        armSubjectId,
        termId,
        scores: nextRows.map((r) => ({
          studentId: r.id,
          ca1: r.ca1,
          ca2: r.ca2,
          exam: r.exam,
        })),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setMsg(data.error || "Save failed");
      return;
    }
    setOk(true);
    setMsg(`Saved and graded ${data.count ?? nextRows.length} student(s).`);
  }

  const q = studentFilter.trim().toLowerCase();
  const visibleRows = q
    ? rows.filter((r) => r.name.toLowerCase().includes(q))
    : rows;

  return (
    <div className="space-y-2">
      <p className="text-xs text-ink/50">
        Continuous assessment: CA1 / {CA1_MAX} + CA2 / {CA2_MAX} + Exam / {EXAM_MAX} = 100. Totals
        auto-grade using school grade bands.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          placeholder="Search student name…"
          value={studentFilter}
          onChange={(e) => setStudentFilter(e.target.value)}
          className="w-full max-w-xs border border-line px-3 py-2 text-sm rounded-lg bg-white"
          aria-label="Filter students by name"
        />
        {q && (
          <span className="text-xs text-ink/50">
            {visibleRows.length} of {rows.length}
          </span>
        )}
      </div>
      <div className="ledger-block !p-0 overflow-x-auto">
        <table className="ledger">
          <thead>
            <tr>
              <th>Student</th>
              <th>CA1 (/{CA1_MAX})</th>
              <th>CA2 (/{CA2_MAX})</th>
              <th>Exam (/{EXAM_MAX})</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 && (
              <tr>
                <td colSpan={5} className="text-sm text-ink/50 py-6 text-center">
                  No students match “{studentFilter}”.
                </td>
              </tr>
            )}
            {visibleRows.map((r) => {
              const total = r.ca1 + r.ca2 + r.exam;
              return (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  {(["ca1", "ca2", "exam"] as const).map((field) => (
                    <td key={field}>
                      <input
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]*"
                        autoComplete="off"
                        value={displayValue(r.id, field)}
                        onChange={(e) => onChange(r.id, field, e.target.value)}
                        onBlur={() => commit(r.id, field)}
                        onFocus={(e) => e.target.select()}
                        className="w-16 border border-line px-2 py-1 text-sm tabular-nums"
                        aria-label={`${field} for ${r.name}`}
                      />
                    </td>
                  ))}
                  <td className={`font-medium tabular-nums ${total > 100 ? "text-brick" : ""}`}>
                    {total}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="p-4 flex flex-wrap items-center gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="bg-navy text-paper text-sm px-5 py-2.5 hover:bg-navy-light disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Scores"}
          </button>
          {msg && <span className={`text-sm ${ok ? "text-sage" : "text-brick"}`}>{msg}</span>}
        </div>
      </div>
    </div>
  );
}
