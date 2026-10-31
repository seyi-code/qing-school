"use client";

import { useState } from "react";
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

export function ExpensesBoard({ expenses }: { expenses: Row[] }) {
  const [editing, setEditing] = useState<ExpenseEdit | null>(null);

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
        <div className="p-4 pb-2">
          <h2 className="font-serif text-lg text-navy">Recent expenses</h2>
          <p className="text-xs text-ink/50 mt-0.5">Tap a row to edit or delete</p>
        </div>
        {expenses.length === 0 ? (
          <EmptyState
            title="No expenses yet"
            description="Record utilities, supplies, and other school costs."
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
                {expenses.map((e) => {
                  const active = editing?.id === e.id;
                  return (
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
                      className={`border-b border-line/60 last:border-0 cursor-pointer transition-colors ${
                        active
                          ? "bg-navy/5 ring-1 ring-inset ring-navy/20"
                          : "hover:bg-line/30"
                      }`}
                    >
                      <td className="px-4 py-2.5 tabular-nums whitespace-nowrap">
                        {formatDate(e.date)}
                      </td>
                      <td className="px-4 py-2.5">{e.category}</td>
                      <td className="px-4 py-2.5 text-ink/70">{e.description || "—"}</td>
                      <td className="px-4 py-2.5 tabular-nums font-medium">
                        {formatNaira(e.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
