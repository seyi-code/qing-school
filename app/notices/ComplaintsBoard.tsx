"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/format";

export type ComplaintRow = {
  id: string;
  title: string;
  body: string;
  status: string;
  internalNote: string | null;
  contactName: string | null;
  contactValue: string | null;
  createdAt: string | Date;
};

const STATUSES = ["OPEN", "ACKNOWLEDGED", "RESOLVED", "ARCHIVED"] as const;

function statusTone(s: string) {
  switch (s) {
    case "OPEN":
      return "bg-gold/15 text-gold border-gold/30";
    case "ACKNOWLEDGED":
      return "bg-sky-100 text-sky-800 border-sky-200";
    case "RESOLVED":
      return "bg-sage/15 text-sage border-sage/30";
    case "ARCHIVED":
      return "bg-ink/5 text-ink/50 border-line";
    default:
      return "bg-line/40 text-ink/60 border-line";
  }
}

function contactFromBody(body: string) {
  const m = body.match(/Contact:\s*(.+)/i);
  return (m?.[1] || "").trim().split("\n")[0].trim();
}

export function ComplaintsBoard({ complaints }: { complaints: ComplaintRow[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const selected = complaints.find((c) => c.id === selectedId) || null;

  function select(c: ComplaintRow) {
    setSelectedId(c.id);
    setNote(c.internalNote || "");
    setReply("");
    setError(null);
    setMsg(null);
  }

  async function setStatus(status: string) {
    if (!selected) return;
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch("/api/complaints", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed");
        setBusy(false);
        return;
      }
      setMsg(`Marked ${status.toLowerCase()}`);
      router.refresh();
    } catch {
      setError("Network error");
    }
    setBusy(false);
  }

  async function saveNote() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch("/api/complaints", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, internalNote: note }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed");
        setBusy(false);
        return;
      }
      setMsg("Note saved");
      router.refresh();
    } catch {
      setError("Network error");
    }
    setBusy(false);
  }

  async function sendReply() {
    if (!selected || !reply.trim()) return;
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, reply: reply.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Reply failed");
        setBusy(false);
        return;
      }
      setMsg(`Reply sent via ${data.channel || "message"}`);
      setReply("");
      router.refresh();
    } catch {
      setError("Network error");
    }
    setBusy(false);
  }

  async function remove() {
    if (!selected) return;
    if (!window.confirm("Delete this complaint permanently?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/complaints", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Delete failed");
        setBusy(false);
        return;
      }
      setSelectedId(null);
      router.refresh();
    } catch {
      setError("Network error");
    }
    setBusy(false);
  }

  if (complaints.length === 0) {
    return (
      <EmptyState
        title="No complaints"
        description="Items submitted from the public site appear here."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <ul className="space-y-2 lg:col-span-2">
        {complaints.map((c) => {
          const active = selectedId === c.id;
          return (
            <li
              key={c.id}
              onClick={() => select(c)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  select(c);
                }
              }}
              tabIndex={0}
              role="button"
              className={`rounded-xl border p-3 cursor-pointer transition-colors ${
                active
                  ? "border-navy/40 bg-navy/5 ring-1 ring-navy/15"
                  : "border-line/80 bg-white/80 hover:border-navy/25"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-medium text-sm text-navy">
                  {c.title.replace(/^\[Complaint\]\s*/i, "")}
                </p>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md border ${
                    statusTone(c.status || "OPEN")
                  }`}
                >
                  {c.status || "OPEN"}
                </span>
              </div>
              <p className="text-xs text-ink/50 mt-0.5">{formatDate(c.createdAt)}</p>
              {(c.contactName || c.contactValue) && (
                <p className="text-xs text-ink/60 mt-1">
                  {c.contactName || "—"}
                  {c.contactValue ? ` · ${c.contactValue}` : ""}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      <div className="lg:col-span-3 rounded-xl border border-line bg-white p-4 sm:p-5 shadow-sm space-y-4">
        {!selected ? (
          <p className="text-sm text-ink/50">
            Select a complaint to update status, add a note, or reply.
          </p>
        ) : (
          <>
            <div>
              <h3 className="font-serif text-lg text-navy">
                {selected.title.replace(/^\[Complaint\]\s*/i, "")}
              </h3>
              <p className="text-xs text-ink/50 mt-0.5">{formatDate(selected.createdAt)}</p>
              <p className="text-sm text-ink/70 mt-2 whitespace-pre-wrap">{selected.body}</p>
            </div>

            {error && <p className="text-xs text-brick">{error}</p>}
            {msg && <p className="text-xs text-sage">{msg}</p>}

            <div>
              <p className="text-[10px] uppercase tracking-wide text-ink/50 font-medium mb-1.5">
                Status
              </p>
              <div className="flex flex-wrap gap-1.5">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={busy || (selected.status || "OPEN") === s}
                    onClick={() => setStatus(s)}
                    className={`text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-md border disabled:opacity-50 ${
                      (selected.status || "OPEN") === s
                        ? statusTone(s)
                        : "border-line text-ink/60 hover:bg-line/30"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wide text-ink/50 font-medium">
                Internal note (staff only)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="mt-1 w-full border border-line rounded-lg px-3 py-2 text-sm"
                placeholder="Private notes for the office…"
              />
              <button
                type="button"
                disabled={busy}
                onClick={saveNote}
                className="mt-2 text-sm border border-line rounded-lg px-3 py-1.5 hover:bg-line/20 disabled:opacity-60"
              >
                Save note
              </button>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wide text-ink/50 font-medium">
                Reply to sender
              </label>
              <p className="text-xs text-ink/45 mt-0.5 mb-1">
                Uses email if contact looks like an email, otherwise SMS.
                {selected.contactValue || contactFromBody(selected.body)
                  ? ` → ${selected.contactValue || contactFromBody(selected.body)}`
                  : " (no contact found)"}
              </p>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={3}
                className="w-full border border-line rounded-lg px-3 py-2 text-sm"
                placeholder="Your reply…"
              />
              <button
                type="button"
                disabled={busy || !reply.trim()}
                onClick={sendReply}
                className="mt-2 text-sm bg-navy text-paper rounded-lg px-3 py-1.5 disabled:opacity-60"
              >
                {busy ? "Sending…" : "Send reply"}
              </button>
            </div>

            <div className="pt-1 border-t border-line/60">
              <button
                type="button"
                disabled={busy}
                onClick={remove}
                className="text-sm text-brick border border-brick/30 rounded-lg px-3 py-1.5 hover:bg-brick/5 disabled:opacity-60"
              >
                Delete complaint
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
