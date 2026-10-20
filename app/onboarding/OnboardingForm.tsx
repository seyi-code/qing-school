"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordInput } from "@/components/ui/PasswordInput";

/** Form UI for platform admins (session already verified on the server). */
export function OnboardingForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const body = {
      schoolName: fd.get("schoolName"),
      shortName: fd.get("shortName"),
      slug: fd.get("slug"),
      plan: fd.get("plan") || "STARTER",
      adminName: fd.get("adminName"),
      adminEmail: fd.get("adminEmail"),
      adminPassword: fd.get("adminPassword"),
      phone: fd.get("phone") || undefined,
      address: fd.get("address") || undefined,
    };
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not create school");
      return;
    }
    router.push(data.redirectTo || "/platform");
  }

  return (
    <main className="min-h-screen bg-[#f4f6f9] text-[#1e2e43]">
      <header className="border-b border-[#e3e8ed] bg-white">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#627184]">Platform</p>
            <h1 className="font-serif text-lg text-[#12345a] m-0">Onboard a school</h1>
          </div>
          <Link href="/platform" className="text-sm font-semibold text-[#12345a] hover:underline">
            ← Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-8">
        <p className="text-sm text-[#627184] mb-5">
          Creates an isolated workspace with its own admin, branding, and data. New schools start on a{" "}
          <strong>trial</strong> (see platform billing settings).
        </p>
        <form
          onSubmit={submit}
          className="bg-white border border-[#e3e8ed] rounded-2xl p-5 space-y-3.5 text-sm shadow-sm"
        >
          <label className="block">
            School full name
            <input
              name="schoolName"
              required
              className="mt-1 w-full border border-[#e3e8ed] px-3 py-2 rounded-lg bg-white"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              Short name
              <input
                name="shortName"
                required
                placeholder="KMS"
                maxLength={12}
                className="mt-1 w-full border border-[#e3e8ed] px-3 py-2 rounded-lg bg-white"
              />
            </label>
            <label className="block">
              URL slug
              <input
                name="slug"
                required
                placeholder="my-school"
                pattern="[a-z0-9\-]+"
                className="mt-1 w-full border border-[#e3e8ed] px-3 py-2 rounded-lg bg-white font-mono text-xs"
              />
            </label>
          </div>
          <label className="block">
            Plan
            <select name="plan" className="mt-1 w-full border border-[#e3e8ed] px-3 py-2 rounded-lg bg-white">
              <option value="STARTER">Starter (~300 students)</option>
              <option value="PRO">Pro (~1,500)</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
          </label>
          <label className="block">
            Admin full name
            <input
              name="adminName"
              required
              className="mt-1 w-full border border-[#e3e8ed] px-3 py-2 rounded-lg bg-white"
            />
          </label>
          <label className="block">
            Admin email
            <input
              name="adminEmail"
              type="email"
              required
              className="mt-1 w-full border border-[#e3e8ed] px-3 py-2 rounded-lg bg-white"
            />
          </label>
          <label className="block">
            Admin password (10+ chars, mixed)
            <PasswordInput
              name="adminPassword"
              required
              minLength={10}
              className="mt-1 w-full border border-[#e3e8ed] px-3 py-2 rounded-lg bg-white"
            />
          </label>
          <label className="block">
            Phone (optional)
            <input name="phone" className="mt-1 w-full border border-[#e3e8ed] px-3 py-2 rounded-lg bg-white" />
          </label>
          <label className="block">
            Address (optional)
            <input
              name="address"
              className="mt-1 w-full border border-[#e3e8ed] px-3 py-2 rounded-lg bg-white"
            />
          </label>
          {error && <p className="text-red-700 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-[#12345a] text-white py-3 font-semibold disabled:opacity-60"
          >
            {busy ? "Creating…" : "Create school workspace"}
          </button>
        </form>
      </div>
    </main>
  );
}
