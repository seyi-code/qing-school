"use client";

import { FormEvent, useState } from "react";
import { MarketingNav } from "@/components/marketing/MarketingNav";

export default function ComplaintsPage() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(fd.entries())),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        setLoading(false);
        return;
      }
      setDone(data.message);
      (e.target as HTMLFormElement).reset();
    } catch {
      setError("Network error");
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#f7f5ef] text-[#1e2e43]">
      <MarketingNav />
      <div className="max-w-lg mx-auto px-4 py-10">
        <p className="text-xs font-extrabold tracking-[0.16em] uppercase text-[#a57d13]">Contact</p>
        <h1 className="font-serif text-3xl text-[#12345a] mt-1 mb-2">Complaint / Feedback</h1>
        <p className="text-sm text-[#627184] mb-6">
          Share a concern or suggestion with the school office. This is not for emergencies.
        </p>
        {done ? (
          <div className="bg-white border border-[#e3e8ed] rounded-2xl p-5 text-sage text-sm shadow-sm">
            {done}
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="bg-white border border-[#e3e8ed] rounded-2xl p-5 space-y-3 shadow-sm"
          >
            {error && <p className="text-brick text-sm">{error}</p>}
            <input
              name="name"
              required
              placeholder="Your name"
              className="w-full border border-[#e3e8ed] px-3 py-2.5 text-sm rounded-lg"
            />
            <input
              name="contact"
              required
              placeholder="Phone or email"
              className="w-full border border-[#e3e8ed] px-3 py-2.5 text-sm rounded-lg"
            />
            <input
              name="subject"
              required
              placeholder="Subject"
              className="w-full border border-[#e3e8ed] px-3 py-2.5 text-sm rounded-lg"
            />
            <textarea
              name="message"
              required
              rows={5}
              placeholder="Message"
              className="w-full border border-[#e3e8ed] px-3 py-2.5 text-sm rounded-lg"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#12345a] text-white py-3 text-sm font-semibold disabled:opacity-60"
            >
              {loading ? "Sending…" : "Submit"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
