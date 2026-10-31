"use client";

import { useState } from "react";
import { NoticeForm, type NoticeEdit } from "./NoticeForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/format";

type NoticeRow = {
  id: string;
  title: string;
  body: string;
  audience: string;
  publishToWeb: boolean;
  createdAt: string | Date;
};

export function NoticesBoard({ notices }: { notices: NoticeRow[] }) {
  const [editing, setEditing] = useState<NoticeEdit | null>(null);

  function selectNotice(n: NoticeRow) {
    setEditing({
      id: n.id,
      title: n.title,
      body: n.body,
      audience: n.audience,
      publishToWeb: Boolean(n.publishToWeb),
    });
    if (typeof document !== "undefined") {
      document.getElementById("notice-form")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }

  return (
    <div className="grid md:grid-cols-3 gap-4 sm:gap-5 mb-4 sm:mb-5">
      <section
        id="notice-form"
        className="rounded-xl border border-sky-200/80 bg-gradient-to-br from-sky-50 to-white p-4 sm:p-5 shadow-sm scroll-mt-24"
      >
        <NoticeForm editing={editing} onCancel={() => setEditing(null)} />
      </section>
      <section className="md:col-span-2 rounded-xl border border-line bg-white shadow-sm p-4 sm:p-5">
        <h2 className="font-serif text-lg text-navy mb-1">Recent notices</h2>
        <p className="text-xs text-ink/50 mb-3">Tap a notice to edit or delete</p>
        {notices.length === 0 ? (
          <EmptyState
            title="No notices yet"
            description="Post a notice for staff, students, or parents."
          />
        ) : (
          <ul className="space-y-3">
            {notices.map((n) => {
              const active = editing?.id === n.id;
              return (
                <li
                  key={n.id}
                  onClick={() => selectNotice(n)}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter" || ev.key === " ") {
                      ev.preventDefault();
                      selectNotice(n);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  className={`rounded-xl border p-3 cursor-pointer transition-colors ${
                    active
                      ? "border-navy/40 bg-navy/5 ring-1 ring-navy/15"
                      : "border-line/80 bg-white/80 hover:border-navy/25 hover:bg-line/20"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-medium text-sm text-navy">{n.title}</p>
                    <span className="status-pill text-[10px]">
                      {n.audience}
                      {n.publishToWeb ? " · web" : ""}
                    </span>
                  </div>
                  <p className="text-xs text-ink/50 mt-0.5">{formatDate(n.createdAt)}</p>
                  <p className="text-sm text-ink/70 mt-1.5 whitespace-pre-wrap line-clamp-4">{n.body}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
