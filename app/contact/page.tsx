"use client";

import { FormEvent, useState } from "react";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { SCHOOL } from "@/lib/school-config";

/**
 * Public Contact: phone / email / address first, then optional message form
 * (same backend as legacy /complaints).
 */
export default function ContactPage() {
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
      setDone(data.message || "Thank you. The school office has received your message.");
      (e.target as HTMLFormElement).reset();
    } catch {
      setError("Network error");
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#f7f5ef] text-[#1e2e43] flex flex-col">
      <MarketingNav />
      <div className="max-w-3xl mx-auto px-4 py-10 flex-1 w-full">
        <p className="text-xs font-extrabold tracking-[0.16em] uppercase text-[#a57d13]">Contact</p>
        <h1 className="font-serif text-3xl text-[#12345a] mt-1 mb-2">Get in touch</h1>
        <p className="text-sm text-[#627184] mb-8">
          Call or visit the office for admissions and urgent matters. Use the form below for general
          enquiries, suggestions, or non-urgent feedback.
        </p>

        <div className="grid sm:grid-cols-3 gap-3 mb-10">
          <a
            href={`tel:${SCHOOL.contact.phone}`}
            className="bg-white border border-[#e3e8ed] rounded-2xl p-4 shadow-sm hover:border-[#12345a]/40 transition"
          >
            <p className="text-xs font-extrabold uppercase tracking-wide text-[#a57d13]">Phone</p>
            <p className="text-sm font-semibold text-[#12345a] mt-1">{SCHOOL.contact.phone}</p>
            <p className="text-[11px] text-[#627184] mt-1">Tap to call</p>
          </a>
          <a
            href={`mailto:${SCHOOL.contact.email}`}
            className="bg-white border border-[#e3e8ed] rounded-2xl p-4 shadow-sm hover:border-[#12345a]/40 transition"
          >
            <p className="text-xs font-extrabold uppercase tracking-wide text-[#a57d13]">Email</p>
            <p className="text-sm font-semibold text-[#12345a] mt-1 break-all">{SCHOOL.contact.email}</p>
            <p className="text-[11px] text-[#627184] mt-1">Office inbox</p>
          </a>
          <div className="bg-white border border-[#e3e8ed] rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-extrabold uppercase tracking-wide text-[#a57d13]">Visit</p>
            <p className="text-sm font-semibold text-[#12345a] mt-1">{SCHOOL.contact.address}</p>
            <p className="text-[11px] text-[#627184] mt-1">School campus</p>
          </div>
        </div>

        <h2 className="font-serif text-xl text-[#12345a] mb-1">Send a message</h2>
        <p className="text-sm text-[#627184] mb-4">
          For suggestions or non-urgent concerns. This is not for emergencies — please call the office.
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
              {loading ? "Sending…" : "Send message"}
            </button>
          </form>
        )}
      </div>
      <MarketingFooter />
    </main>
  );
}
