"use client";

import { useState } from "react";
import { BrandLoadingLabel } from "@/components/ui/BrandSpinner";

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
  const [loading, setLoading] = useState(false);
  const shown = notices.slice(0, visible);
  const hasMore = notices.length > visible;

  function onShowMore() {
    if (loading) return;
    setLoading(true);
    // Brief branded pause so the indicator is visible (data is already local)
    window.setTimeout(() => {
      setVisible((v) => v + INITIAL);
      setLoading(false);
    }, 320);
  }

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
            onClick={onShowMore}
            disabled={loading}
            className="inline-flex items-center justify-center min-w-[10.5rem] rounded-xl border border-[#e3e8ed] dark:border-white/15 bg-white dark:bg-[#132338] px-5 py-2.5 text-sm font-bold hover:brightness-95 disabled:opacity-70 disabled:cursor-wait"
            style={{ color: primaryColor }}
          >
            <BrandLoadingLabel
              loading={loading}
              idleLabel="Show more news →"
              loadingLabel="Loading…"
              color={primaryColor}
            />
          </button>
          <p className="text-[11px] text-[#627184] dark:text-[#a8b8c9] mt-2 mb-0">
            Showing {shown.length} of {notices.length} from {shortName}
          </p>
        </div>
      ) : null}
    </>
  );
}
