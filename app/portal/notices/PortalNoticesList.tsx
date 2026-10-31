"use client";

import { useState } from "react";
import { formatDate } from "@/lib/format";

export type PortalNotice = {
  id: string;
  title: string;
  body: string;
  audience: string;
  createdAt: string | Date;
};

export function PortalNoticesList({
  notices,
  replyAsName,
  replyContact,
}: {
  notices: PortalNotice[];
  replyAsName: string;
  replyContact: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function sendReply(notice: PortalNotice) {
    if (!message.trim()) return;
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch("/api/portal/notice-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noticeId: notice.id,
          message: message.trim(),
          name: replyAsName,
          contact: replyContact,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not send message");
        setBusy(false);
        return;
      }
      setOk("Message sent to the school office.");
      setMessage("");
      setReplyFor(null);
    } catch {
      setError("Network error");
    }
    setBusy(false);
  }

  if (notices.length === 0) {
    return (
      <p className="text-sm text-ink/45 py-8 text-center">
        No notices for you right now.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {notices.map((n) => {
        const open = openId === n.id;
        const replying = replyFor === n.id;
        return (
          <li
            key={n.id}
            className={`rounded-xl border bg-white shadow-sm transition-colors ${
              open ? "border-navy/30 ring-1 ring-navy/10" : "border-line/80"
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setOpenId(open ? null : n.id);
                setError(null);
                setOk(null);
              }}
              className="w-full text-left p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-medium text-sm sm:text-base text-navy pr-2">{n.title}</p>
                <span className="text-[10px] uppercase tracking-wide text-ink/45 shrink-0">
                  {formatDate(n.createdAt)}
                </span>
              </div>
              <p
                className={`text-sm text-ink/70 mt-1.5 whitespace-pre-wrap ${
                  open ? "" : "line-clamp-2"
                }`}
              >
                {n.body}
              </p>
              <p className="text-xs text-navy/70 mt-2 font-medium">
                {open ? "Tap to collapse" : "Tap to read full notice"}
              </p>
            </button>

            {open && (
              <div className="px-4 sm:px-5 pb-4 space-y-3 border-t border-line/50 pt-3">
                {!replying ? (
                  <button
                    type="button"
                    onClick={() => {
                      setReplyFor(n.id);
                      setMessage("");
                      setError(null);
                      setOk(null);
                    }}
                    className="text-sm border border-line rounded-lg px-3 py-1.5 hover:bg-line/20"
                  >
                    Message the school about this
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-ink/50">
                      Your message goes to the school office (not a public comment).
                    </p>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      className="w-full border border-line rounded-lg px-3 py-2 text-sm"
                      placeholder="Write your message…"
                    />
                    {error && <p className="text-xs text-brick">{error}</p>}
                    {ok && <p className="text-xs text-sage">{ok}</p>}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy || !message.trim()}
                        onClick={() => sendReply(n)}
                        className="text-sm bg-navy text-paper rounded-lg px-3 py-1.5 disabled:opacity-60"
                      >
                        {busy ? "Sending…" : "Send to school"}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setReplyFor(null)}
                        className="text-sm border border-line rounded-lg px-3 py-1.5"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                {ok && !replying && <p className="text-xs text-sage">{ok}</p>}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
