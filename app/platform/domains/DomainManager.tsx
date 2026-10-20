"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type School = {
  id: string;
  name: string;
  slug: string;
  customDomain: string | null;
  domainVerifiedAt: string | null;
};

export function DomainManager({ schools }: { schools: School[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>(
    Object.fromEntries(schools.map((s) => [s.id, s.customDomain || ""]))
  );

  async function save(schoolId: string, opts?: { verify?: boolean; clear?: boolean }) {
    setBusy(schoolId);
    setMsg("");
    const res = await fetch("/api/platform/domains", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        schoolId,
        customDomain: opts?.clear ? null : drafts[schoolId] || null,
        verify: opts?.verify || false,
        clear: opts?.clear || false,
      }),
    });
    const data = await res.json();
    setBusy(null);
    if (!res.ok) {
      setMsg(data.error || "Failed");
      return;
    }
    setMsg(`Updated ${data.school?.name || "school"}`);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {msg ? <p className="text-sm text-sage">{msg}</p> : null}
      <p className="text-sm text-ink/60">
        After DNS points the domain at Vercel, set it here then click Mark verified. Public site
        resolves via verified customDomain.
      </p>
      <div className="space-y-3">
        {schools.map((s) => (
          <div key={s.id} className="ledger-block space-y-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="font-medium m-0">{s.name}</p>
                <p className="text-xs text-ink/50 m-0">
                  slug <code>{s.slug}</code> · preview <code>/site/{s.slug}</code>
                </p>
              </div>
              <span className={`text-xs ${s.domainVerifiedAt ? "text-sage" : "text-ink/40"}`}>
                {s.domainVerifiedAt ? "Verified" : s.customDomain ? "Not verified" : "No domain"}
              </span>
            </div>
            <input
              value={drafts[s.id] ?? ""}
              onChange={(e) =>
                setDrafts((d) => ({ ...d, [s.id]: e.target.value.toLowerCase() }))
              }
              placeholder="www.school.edu.ng"
              className="w-full border border-line px-3 py-2 text-sm font-mono"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy === s.id}
                onClick={() => save(s.id)}
                className="rounded-lg bg-[#12345a] text-white px-3 py-1.5 text-sm"
              >
                Save domain
              </button>
              <button
                type="button"
                disabled={busy === s.id || !(drafts[s.id] || s.customDomain)}
                onClick={() => save(s.id, { verify: true })}
                className="rounded-lg border border-line px-3 py-1.5 text-sm"
              >
                Mark verified
              </button>
              <button
                type="button"
                disabled={busy === s.id}
                onClick={() => save(s.id, { clear: true })}
                className="rounded-lg text-brick px-3 py-1.5 text-sm underline"
              >
                Clear
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
