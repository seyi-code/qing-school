"use client";

import { useState } from "react";

type Notice = { id: string; title: string; body: string };

const INITIAL = 4;

export function HomeNewsSection({
  notices,
  primaryColor,
  shortName,
}: {
  notices: Notice[];
  primaryColor: string;
  shortName: string;
}) {
  const [visible, setVisible] = useState(INITIAL);
  const shown = notices.slice(0, visible);
  const hasMore = notices.length > visible;

  if (notices.length === 0) {
    return (
      <p className="text-[#627184] dark:text-[#a8b8c9] text-sm">
        Contact the school for current events, term dates and programme updates.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {shown.map((n) => (
          <article
            key={n.id}
            className="bg-white dark:bg-[#132338] border border-[#e3e8ed] dark:border-white/10 rounded-xl p-5"
          >
            <h3 className="font-bold m-0 dark:text-[#e8eef5]" style={{ color: primaryColor }}>
              {n.title}
            </h3>
            <p className="text-sm text-[#627184] dark:text-[#a8b8c9] mt-2 mb-0 line-clamp-3">
              {n.body}
            </p>
          </article>
        ))}
      </div>
      {hasMore ? (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + INITIAL)}
            className="inline-flex items-center rounded-xl border border-[#e3e8ed] dark:border-white/15 bg-white dark:bg-[#132338] px-5 py-2.5 text-sm font-bold hover:brightness-95"
            style={{ color: primaryColor }}
          >
            Show more news →
          </button>
          <p className="text-[11px] text-[#627184] dark:text-[#a8b8c9] mt-2 mb-0">
            Showing {shown.length} of {notices.length} from {shortName}
          </p>
        </div>
      ) : null}
    </>
  );
}
