"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function InstallCmsPackButton({
  schoolName,
  pageCount = 0,
  templateSlug = "dms",
}: {
  schoolName?: string | null;
  pageCount?: number;
  /** School slug to copy pages from (default DMS) */
  templateSlug?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function install(opts: {
    force: boolean;
    mode: "default" | "from_template";
  }) {
    if (opts.force) {
      const label =
        opts.mode === "from_template"
          ? `Overwrite existing CMS pages with the ${templateSlug.toUpperCase()} template (rebrands names/links for this school)?`
          : "Overwrite existing CMS pages (home, about, admissions, contact) with the default pack?";
      if (!window.confirm(label)) return;
    }
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/cms/pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          force: opts.force,
          mode: opts.mode,
          sourceSlug: opts.mode === "from_template" ? templateSlug : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Install failed");
        return;
      }
      setMsg(data.message || "Done");
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
            Pages for {schoolName || "this school"}
          </h2>
          <p className="text-xs text-ink/55 mt-1 max-w-xl leading-relaxed">
            Install starter <strong>home</strong>, <strong>about</strong>,{" "}
            <strong>admissions</strong>, and <strong>contact</strong> pages, or copy the{" "}
            <strong>{templateSlug.toUpperCase()}</strong> school template (names and{" "}
            <code className="text-[10px]">?school=</code> links are rebranded). Currently{" "}
            {pageCount} page{pageCount === 1 ? "" : "s"} in CMS.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => install({ force: false, mode: "default" })}
            className="btn-primary !text-xs !px-3 !py-2 disabled:opacity-60"
          >
            {busy ? "Working…" : "Install missing pages"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => install({ force: false, mode: "from_template" })}
            className="btn-ghost !text-xs !px-3 !py-2 disabled:opacity-60"
          >
            Apply {templateSlug.toUpperCase()} template
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => install({ force: true, mode: "default" })}
            className="btn-ghost !text-xs !px-3 !py-2 disabled:opacity-60"
          >
            Force default pack
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => install({ force: true, mode: "from_template" })}
            className="btn-ghost !text-xs !px-3 !py-2 disabled:opacity-60"
          >
            Force {templateSlug.toUpperCase()} template
          </button>
        </div>
      </div>
      {msg ? <p className="text-xs text-ink/70 mt-2">{msg}</p> : null}
    </div>
  );
}
