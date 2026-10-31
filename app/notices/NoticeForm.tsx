"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export type NoticeEdit = {
  id: string;
  title: string;
  body: string;
  audience: string;
  publishToWeb: boolean;
};

export function NoticeForm({
  editing,
  onCancel,
}: {
  editing?: NoticeEdit | null;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(editing?.title || "");
  const [body, setBody] = useState(editing?.body || "");
  const [audience, setAudience] = useState(editing?.audience || "ALL");
  const [publishToWeb, setPublishToWeb] = useState(editing?.publishToWeb || false);
  const [alsoSendSms, setAlsoSendSms] = useState(false);

  useEffect(() => {
    if (editing) {
      setTitle(editing.title);
      setBody(editing.body);
      setAudience(editing.audience || "ALL");
      setPublishToWeb(Boolean(editing.publishToWeb));
      setAlsoSendSms(false);
      setError(null);
    } else {
      setTitle("");
      setBody("");
      setAudience("ALL");
      setPublishToWeb(false);
      setAlsoSendSms(false);
      setError(null);
    }
  }, [editing]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const payload = editing
      ? {
          id: editing.id,
          title: title.trim(),
          body: body.trim(),
          audience,
          publishToWeb,
        }
      : {
          title: title.trim(),
          body: body.trim(),
          audience,
          publishToWeb,
          alsoSendSms,
        };
    try {
      const res = await fetch("/api/notices", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to save notice");
        setSubmitting(false);
        return;
      }
      if (!editing) {
        setTitle("");
        setBody("");
        setAudience("ALL");
        setPublishToWeb(false);
        setAlsoSendSms(false);
      }
      onCancel?.();
      router.refresh();
    } catch {
      setError("Network error");
    }
    setSubmitting(false);
  }

  async function onDelete() {
    if (!editing) return;
    if (!window.confirm("Delete this notice? This cannot be undone.")) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/notices", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Delete failed");
        setSubmitting(false);
        return;
      }
      onCancel?.();
      router.refresh();
    } catch {
      setError("Network error");
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h2 className="font-serif text-lg">{editing ? "Edit notice" : "Post a Notice"}</h2>
      {editing && (
        <p className="text-xs text-navy/80 bg-navy/5 border border-navy/15 rounded-lg px-2.5 py-1.5">
          Editing notice — SMS is not re-sent on update.
        </p>
      )}
      {error && <p className="text-brick text-xs">{error}</p>}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        placeholder="Title"
        className="w-full border border-line px-3 py-2 text-sm rounded-lg bg-white"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        required
        rows={4}
        placeholder="Message"
        className="w-full border border-line px-3 py-2 text-sm rounded-lg bg-white"
      />
      <select
        value={audience}
        onChange={(e) => setAudience(e.target.value)}
        className="w-full border border-line px-3 py-2 text-sm rounded-lg bg-white"
      >
        <option value="ALL">Everyone</option>
        <option value="STAFF">Staff only</option>
        <option value="STUDENTS">Students only</option>
        <option value="PARENTS">Parents only</option>
      </select>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={publishToWeb}
          onChange={(e) => setPublishToWeb(e.target.checked)}
        />
        Also publish on public website
      </label>
      {!editing && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={alsoSendSms}
            onChange={(e) => setAlsoSendSms(e.target.checked)}
          />
          Also send as SMS
        </label>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-navy text-paper text-sm py-2.5 rounded-lg disabled:opacity-60"
      >
        {submitting ? "Saving…" : editing ? "Update notice" : "Post Notice"}
      </button>
      {editing && (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={submitting}
            onClick={() => onCancel?.()}
            className="flex-1 border border-line py-2 rounded-lg text-sm text-ink/70 hover:bg-line/20 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={onDelete}
            className="flex-1 border border-brick/40 text-brick py-2 rounded-lg text-sm hover:bg-brick/5 disabled:opacity-60"
          >
            Delete
          </button>
        </div>
      )}
    </form>
  );
}
