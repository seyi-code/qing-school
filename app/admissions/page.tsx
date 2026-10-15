"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/MarketingNav";

export default function AdmissionsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ admissionNumber: string; message: string } | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());

    try {
      const res = await fetch("/api/admissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Submission failed");
        setLoading(false);
        return;
      }
      setDone({ admissionNumber: data.admissionNumber, message: data.message });
    } catch {
      setError("Network error. Try again.");
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#f7f5ef] text-[#1e2e43]">
      <MarketingNav />

      <div className="max-w-xl mx-auto px-4 py-10">
        <p className="text-xs font-extrabold tracking-[0.16em] uppercase text-[#a57d13]">Admissions</p>
        <h1 className="font-serif text-3xl text-[#12345a] mt-1 mb-2">Online Admission</h1>
        <p className="text-sm text-[#627184] mb-8">
          Submit an application for the current session. The office will review and contact you.
        </p>

        {done ? (
          <div className="bg-white border border-[#e3e8ed] rounded-2xl p-5 space-y-3 shadow-sm">
            <p className="text-sage font-medium">Application received</p>
            <p className="text-sm">{done.message}</p>
            <p className="font-serif text-2xl text-[#12345a]">{done.admissionNumber}</p>
            <p className="text-xs text-[#627184]">Save this number for follow-up.</p>
            <Link href="/" className="inline-block text-sm text-[#12345a] font-semibold underline mt-2">
              Back to homepage
            </Link>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="bg-white border border-[#e3e8ed] rounded-2xl p-5 space-y-4 shadow-sm"
          >
            {error && (
              <p className="text-sm text-brick border border-brick/30 px-3 py-2 rounded-lg">{error}</p>
            )}
            <div className="grid sm:grid-cols-2 gap-3">
              <Field name="firstName" label="First name" required />
              <Field name="lastName" label="Last name" required />
            </div>
            <Field name="otherNames" label="Other names" />
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase text-[#627184] mb-1">Gender</label>
                <select
                  name="gender"
                  className="w-full border border-[#e3e8ed] bg-white px-3 py-2.5 text-sm rounded-lg"
                >
                  <option value="">—</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <Field name="dateOfBirth" label="Date of birth" type="date" />
            </div>
            <Field name="address" label="Home address" />
            <Field name="previousSchool" label="Previous school" />
            <Field name="desiredClass" label="Class applying for (e.g. JSS1)" />
            <hr className="border-[#e3e8ed]" />
            <p className="text-xs uppercase tracking-wide text-[#627184]">Parent / Guardian</p>
            <Field name="parentName" label="Full name" required />
            <Field name="parentPhone" label="Phone" required />
            <Field name="parentEmail" label="Email" type="email" />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#12345a] text-white py-3 text-sm font-semibold hover:brightness-110 disabled:opacity-60"
            >
              {loading ? "Submitting…" : "Submit application"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

function Field({
  name,
  label,
  required,
  type = "text",
}: {
  name: string;
  label: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs uppercase text-[#627184] mb-1" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="w-full border border-[#e3e8ed] bg-white px-3 py-2.5 text-sm rounded-lg focus:border-[#12345a] outline-none"
      />
    </div>
  );
}
