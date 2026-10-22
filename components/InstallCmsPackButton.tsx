"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function InstallCmsPackButton({
  schoolName,
  pageCount = 0,
}: {
  schoolName?: string | null;
  pageCount?: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function install(force: boolean) {
    if (force) {
      const ok = window.confirm(
        "Overwrite existing CMS pages (home, about, admissions, contact) with the default pack? Drafts you customized will be replaced."
      );
      if (!ok) return;
    }
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/cms/pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Install failed");
        return;
      }
      setMsg(data.message || "Pack installed");
      router.refresh();
    } catch {
      setMsg("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-navy/15 bg-gradient-to-br from-navy/[0.04] to-white p-4 mb-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-navy/50">
            Content pack
          </p>
          <h2 className="font-serif text-base text-navy mt-0.5">
            Default pages for {schoolName || "this school"}
          </h2>
          <p className="text-xs text-ink/55 mt-1 max-w-xl leading-relaxed">
            Installs school-scoped <strong>home</strong>, <strong>about</strong>,{" "}
            <strong>admissions</strong>, and <strong>contact</strong> pages with starter copy.
            Existing pages are left alone unless you force overwrite. Currently {pageCount} page
            {pageCount === 1 ? "" : "s"} in CMS.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => install(false)}
            className="btn-primary !text-xs !px-3 !py-2 disabled:opacity-60"
          >
            {busy ? "Installing…" : "Install missing pages"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => install(true)}
            className="btn-ghost !text-xs !px-3 !py-2 disabled:opacity-60"
          >
            Force overwrite pack
          </button>
        </div>
      </div>
      {msg && <p className="text-xs text-ink/70 mt-3">{msg}</p>}
    </div>
  );
}
