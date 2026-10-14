"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Arm = { id: string; label: string };
type Term = { id: string; name: string; isCurrent: boolean };
type Item = {
  id: string;
  name: string;
  amount: number;
  compulsory: boolean;
  armId: string;
  termId: string;
};

export function FeeStructureClient({
  arms,
  terms,
  items: initial,
}: {
  arms: Arm[];
  terms: Term[];
  items: Item[];
}) {
  const router = useRouter();
  const [armId, setArmId] = useState(arms[0]?.id || "");
  const [termId, setTermId] = useState(terms.find((t) => t.isCurrent)?.id || terms[0]?.id || "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);

  const filtered = initial.filter((i) => i.armId === armId && i.termId === termId);
  const selectionTotal = filtered.reduce((s, i) => s + i.amount, 0);

  async function addItem(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    setOk(false);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/fees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        armId,
        termId,
        name: fd.get("name"),
        amount: Number(fd.get("amount")),
        compulsory: fd.get("compulsory") === "on",
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error || "Failed to add fee item");
      return;
    }
    setOk(true);
    setMsg("Fee item added.");
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  async function generateInvoices() {
    if (!armId || !termId) return;
    if (
      !window.confirm(
        "Generate term invoices for all ACTIVE students in this class from compulsory fee items? Existing invoices for this term are skipped."
      )
    ) {
      return;
    }
    setBusy(true);
    setMsg("");
    setOk(false);
    const res = await fetch("/api/fees/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ armId, termId }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error || "Generate failed");
      return;
    }
    setOk(true);
    setMsg(`Created ${data.created ?? 0} invoice(s).`);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-sky-200/80 bg-gradient-to-br from-sky-50 to-white p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-xs font-medium uppercase tracking-wide text-ink/50">
            Class / Arm
            <select
              value={armId}
              onChange={(e) => setArmId(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink"
            >
              {arms.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium uppercase tracking-wide text-ink/50">
            Term
            <select
              value={termId}
              onChange={(e) => setTermId(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink"
            >
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {t.isCurrent ? " (current)" : ""}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={busy || filtered.length === 0}
            onClick={generateInvoices}
            className="btn-primary disabled:opacity-50"
          >
            Generate invoices for class
          </button>
          {filtered.length > 0 && (
            <p className="text-xs text-ink/55">
              Selection total{" "}
              <span className="font-semibold text-navy tabular-nums">
                ₦{selectionTotal.toLocaleString()}
              </span>{" "}
              · {filtered.length} item{filtered.length === 1 ? "" : "s"}
            </p>
          )}
        </div>
      </div>

      {msg && (
        <p
          className={`text-sm rounded-xl px-3 py-2 ${
            ok
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {msg}
        </p>
      )}

      <section className="rounded-xl border border-violet-200/70 bg-gradient-to-br from-violet-50/50 to-white shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <h2 className="font-serif text-lg text-navy">Fee items for selection</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="ledger">
            <thead>
              <tr>
                <th>Name</th>
                <th>Amount</th>
                <th>Compulsory</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <tr key={i.id}>
                  <td className="font-medium">{i.name}</td>
                  <td className="tabular-nums">₦{i.amount.toLocaleString("en-NG")}</td>
                  <td>
                    <span
                      className={`status-pill text-[10px] ${
                        i.compulsory ? "text-sage" : "text-ink/50"
                      }`}
                    >
                      {i.compulsory ? "Yes" : "Optional"}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center text-ink/50 py-8">
                    No fee items for this class/term. Add one below.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/80 to-white p-4 sm:p-5 shadow-sm max-w-lg">
        <h2 className="font-serif text-lg text-navy mb-3">Add fee item</h2>
        <form onSubmit={addItem} className="space-y-3 text-sm">
          <label className="block text-ink/70">
            Name (e.g. Tuition, PTA, Uniform)
            <input
              name="name"
              required
              className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5"
            />
          </label>
          <label className="block text-ink/70">
            Amount (NGN)
            <input
              name="amount"
              type="number"
              min={1}
              step="0.01"
              required
              className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5"
            />
          </label>
          <label className="flex items-center gap-2 text-ink/80">
            <input name="compulsory" type="checkbox" defaultChecked className="rounded" />
            Compulsory (included when generating invoices)
          </label>
          <button type="submit" disabled={busy || !armId || !termId} className="btn-primary disabled:opacity-50">
            {busy ? "Saving…" : "Add fee item"}
          </button>
        </form>
      </section>
    </div>
  );
}
