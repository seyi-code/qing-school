"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  "Utilities",
  "Maintenance",
  "Stationery",
  "Transport",
  "Salaries",
  "Feeding",
  "Security",
  "Other",
];

export type ExpenseEdit = {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
};

export function ExpenseForm({
  editing,
  onCancel,
}: {
  editing?: ExpenseEdit | null;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState(editing?.category || CATEGORIES[0]);
  const [description, setDescription] = useState(editing?.description || "");
  const [amount, setAmount] = useState(editing?.amount ? String(editing.amount) : "");
  const [date, setDate] = useState(
    editing?.date || new Date().toISOString().slice(0, 10)
  );

  useEffect(() => {
    if (editing) {
      setCategory(editing.category || CATEGORIES[0]);
      setDescription(editing.description || "");
      setAmount(String(editing.amount ?? ""));
      setDate(editing.date || new Date().toISOString().slice(0, 10));
      setError(null);
    } else {
      setCategory(CATEGORIES[0]);
      setDescription("");
      setAmount("");
      setDate(new Date().toISOString().slice(0, 10));
      setError(null);
    }
  }, [editing]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const payload = {
      category,
      description: description.trim(),
      amount: Number(amount),
      date,
      ...(editing ? { id: editing.id } : {}),
    };
    try {
      const res = await fetch("/api/expenses", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed");
        setLoading(false);
        return;
      }
      if (!editing) {
        setCategory(CATEGORIES[0]);
        setDescription("");
        setAmount("");
        setDate(new Date().toISOString().slice(0, 10));
      }
      onCancel?.();
      router.refresh();
    } catch {
      setError("Network error");
    }
    setLoading(false);
  }

  async function onDelete() {
    if (!editing) return;
    if (!window.confirm("Delete this expense? This cannot be undone.")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/expenses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Delete failed");
        setLoading(false);
        return;
      }
      onCancel?.();
      router.refresh();
    } catch {
      setError("Network error");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 text-sm">
      {editing && (
        <p className="text-xs text-navy/80 bg-navy/5 border border-navy/15 rounded-lg px-2.5 py-1.5">
          Editing expense — change fields and save, or cancel.
        </p>
      )}
      {error && <p className="text-brick text-xs">{error}</p>}
      <div>
        <label className="block text-xs uppercase text-ink/50 mb-1">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          className="w-full border border-line bg-white px-3 py-2 rounded-lg"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs uppercase text-ink/50 mb-1">Description</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="w-full border border-line bg-white px-3 py-2 rounded-lg"
          placeholder="e.g. NEPA bill March"
        />
      </div>
      <div>
        <label className="block text-xs uppercase text-ink/50 mb-1">Amount (₦)</label>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          type="number"
          min={1}
          step="0.01"
          required
          className="w-full border border-line bg-white px-3 py-2 rounded-lg"
        />
      </div>
      <div>
        <label className="block text-xs uppercase text-ink/50 mb-1">Date</label>
        <input
          value={date}
          onChange={(e) => setDate(e.target.value)}
          type="date"
          className="w-full border border-line bg-white px-3 py-2 rounded-lg"
        />
      </div>
      <div className="flex flex-col gap-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-navy text-paper py-2 rounded-lg hover:bg-navy-light disabled:opacity-60"
        >
          {loading ? "Saving…" : editing ? "Update expense" : "Save expense"}
        </button>
        {editing && (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => onCancel?.()}
              className="flex-1 border border-line py-2 rounded-lg text-ink/70 hover:bg-line/20 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={onDelete}
              className="flex-1 border border-brick/40 text-brick py-2 rounded-lg hover:bg-brick/5 disabled:opacity-60"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </form>
  );
}
