"use client";

import { useMemo, useState } from "react";
import { ExpenseForm, type ExpenseEdit } from "./ExpenseForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatNaira, formatDate } from "@/lib/format";

type Row = {
  id: string;
  category: string;
  description: string | null;
  amount: number | string;
  date: string | Date;
};

function toDay(d: string | Date): string {
  if (typeof d === "string") return d.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function csvEscape(v: string) {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export function ExpensesBoard({ expenses }: { expenses: Row[] }) {
  const [editing, setEditing] = useState<ExpenseEdit | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const day = toDay(e.date);
      if (from && day < from) return false;
      if (to && day > to) return false;
      return true;
    });
  }, [expenses, from, to]);

  const filteredTotal = useMemo(
    () => filtered.reduce((s, e) => s + Number(e.amount), 0),
    [filtered]
  );

  function selectRow(e: Row) {
    const d = typeof e.date === "string" ? e.date : e.date.toISOString();
    setEditing({
      id: e.id,
      category: e.category,
      description: e.description || "",
      amount: Number(e.amount),
      date: d.slice(0, 10),
    });
    if (typeof document !== "undefined") {
      document.getElementById("expense-form")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }

  function exportCsv() {
    const header = ["Date", "Category", "Description", "Amount"];
    const lines = [header.join(",")];
    for (const e of filtered) {
      lines.push(
        [
          toDay(e.date),
          csvEscape(e.category),
          csvEscape(e.description || ""),
          String(Number(e.amount)),
        ].join(",")
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses${from ? `_${from}` : ""}${to ? `_${to}` : ""}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
      <section
        id="expense-form"
        className="rounded-xl border border-sky-200/80 bg-gradient-to-br from-sky-50 to-white p-4 sm:p-5 shadow-sm scroll-mt-24"
      >
        <h2 className="font-serif text-lg text-navy mb-3">
          {editing ? "Edit expense" : "Record expense"}
        </h2>
        <ExpenseForm editing={editing} onCancel={() => setEditing(null)} />
      </section>
      <section className="rounded-xl border border-line bg-white shadow-sm overflow-hidden lg:col-span-2">
        <div className="p-4 pb-3 border-b border-line/60 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="font-serif text-lg text-navy">Recent expenses</h2>
              <p className="text-xs text-ink/50 mt-0.5">
                Tap a row to edit or delete
                {from || to
                  ? ` · showing ${filtered.length} of ${expenses.length}`
                  : expenses.length
                    ? ` · ${expenses.length} loaded`
                    : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={exportCsv}
              disabled={filtered.length === 0}
              className="text-sm border border-line rounded-lg px-3 py-1.5 hover:bg-line/20 disabled:opacity-50"
            >
              Export CSV
            </button>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="text-[10px] uppercase tracking-wide text-ink/45 font-medium">
                From
              </label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="mt-0.5 block border border-line rounded-lg px-2.5 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wide text-ink/45 font-medium">
                To
              </label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="mt-0.5 block border border-line rounded-lg px-2.5 py-1.5 text-sm"
              />
            </div>
            {(from || to) && (
              <button
                type="button"
                onClick={() => {
                  setFrom("");
                  setTo("");
                }}
                className="text-sm text-ink/60 px-2 py-1.5 hover:text-navy"
              >
                Clear
              </button>
            )}
            {(from || to) && filtered.length > 0 && (
              <p className="text-xs text-ink/50 ml-auto self-center">
                Range total:{" "}
                <span className="font-semibold text-navy">{formatNaira(filteredTotal)}</span>
              </p>
            )}
          </div>
        </div>
        {filtered.length === 0 ? (
          <EmptyState
            title={expenses.length === 0 ? "No expenses yet" : "No expenses in this range"}
            description={
              expenses.length === 0
                ? "Record utilities, supplies, and other school costs."
                : "Try a wider date range or clear the filter."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink/45 border-b border-line/80">
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Category</th>
                  <th className="px-4 py-2 font-medium">Description</th>
                  <th className="px-4 py-2 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr
                    key={e.id}
                    onClick={() => selectRow(e)}
                    onKeyDown={(ev) => {
                      if (ev.key === "Enter" || ev.key === " ") {
                        ev.preventDefault();
                        selectRow(e);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    className={`border-b border-line/50 cursor-pointer hover:bg-navy/[0.03] ${
                      editing?.id === e.id ? "bg-navy/5" : ""
                    }`}
                  >
                    <td className="px-4 py-2.5 whitespace-nowrap text-ink/70">
                      {formatDate(e.date)}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-navy">{e.category}</td>
                    <td className="px-4 py-2.5 text-ink/70 max-w-[12rem] truncate">
                      {e.description || "—"}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap font-semibold text-navy">
                      {formatNaira(Number(e.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
