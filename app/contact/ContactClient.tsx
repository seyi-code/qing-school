"use client";

import { FormEvent, useState } from "react";
import type { Branding } from "@/lib/branding";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export function ContactClient({
  branding,
  schoolSlug,
}: {
  branding: Branding;
  schoolSlug: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState("");
  const [error, setError] = useState("");
  const homeHref = schoolSlug ? `/site/${schoolSlug}` : "/";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    if (schoolSlug) payload.schoolSlug = schoolSlug;
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        setLoading(false);
        return;
      }
      setDone(data.message || "Thank you. The school office has received your message.");
      (e.target as HTMLFormElement).reset();
    } catch {
      setError("Network error");
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#f7f5ef] text-[#1e2e43] flex flex-col">
      <MarketingNav brand={branding} schoolSlug={schoolSlug} />
      <div className="max-w-xl mx-auto px-4 py-10 flex-1 w-full">
        <p className="text-xs font-extrabold tracking-[0.16em] uppercase text-[#a57d13]">Contact</p>
        <h1 className="font-serif text-3xl text-[#12345a] mt-1 mb-2">
          Contact {branding.shortName || branding.name}
        </h1>
        <div className="text-sm text-[#627184] space-y-1 mb-8">
          {branding.phone ? (
            <p>
              Phone:{" "}
              <a href={`tel:${branding.phone}`} className="text-[#12345a] underline">
                {branding.phone}
              </a>
            </p>
          ) : null}
          {branding.email ? (
            <p>
              Email:{" "}
              <a href={`mailto:${branding.email}`} className="text-[#12345a] underline">
                {branding.email}
              </a>
            </p>
          ) : null}
          {branding.address ? <p>{branding.address}</p> : null}
        </div>
        {done ? (
          <div className="bg-white border border-[#e3e8ed] rounded-2xl p-5 space-y-3">
            <p className="text-sage">{done}</p>
            <a href={homeHref} className="text-sm text-[#12345a] underline">
              Back to homepage
            </a>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="bg-white border border-[#e3e8ed] rounded-2xl p-5 space-y-4 shadow-sm"
          >
            {error && (
              <p className="text-sm text-brick border border-brick/30 px-3 py-2 rounded-lg">{error}</p>
            )}
            <div>
              <label className="block text-xs uppercase text-[#627184] mb-1">Your name</label>
              <input
                name="name"
                required
                className="w-full border border-[#e3e8ed] px-3 py-2.5 text-sm rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs uppercase text-[#627184] mb-1">Phone</label>
              <input name="phone" className="w-full border border-[#e3e8ed] px-3 py-2.5 text-sm rounded-lg" />
            </div>
            <div>
              <label className="block text-xs uppercase text-[#627184] mb-1">Email</label>
              <input
                name="email"
                type="email"
                className="w-full border border-[#e3e8ed] px-3 py-2.5 text-sm rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs uppercase text-[#627184] mb-1">Message</label>
              <textarea
                name="message"
                required
                rows={4}
                className="w-full border border-[#e3e8ed] px-3 py-2.5 text-sm rounded-lg"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#12345a] text-white py-3 text-sm font-semibold disabled:opacity-60"
            >
              {loading ? "Sending…" : "Send message"}
            </button>
          </form>
        )}
      </div>
      <MarketingFooter brand={branding} schoolSlug={schoolSlug} />
    </main>
  );
}
