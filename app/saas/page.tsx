import Link from "next/link";

/**
 * Seyi Code / platform SaaS landing — served on marketing hosts (Phase 1)
 * via middleware rewrite of `/` → `/saas` when NEXT_PUBLIC_MARKETING_HOSTS matches.
 * On legacy hosts this page is still reachable at /saas for preview.
 */
export const dynamic = "force-dynamic";

const FEATURES = [
  {
    icon: "🏫",
    title: "Multi-school SaaS",
    body: "One platform, many schools — isolated data, shared reliability.",
  },
  {
    icon: "₦",
    title: "Fees & payments",
    body: "Invoices, collections, and online pay ready for Nigerian schools.",
  },
  {
    icon: "📊",
    title: "Academics",
    body: "Attendance, scores, and report cards parents can trust.",
  },
  {
    icon: "👨‍👩‍👧",
    title: "Portals",
    body: "Staff, parent, and student access with role-based dashboards.",
  },
];

export default function SaasLandingPage() {
  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#12345a]">
      <header className="border-b border-[#e3e8ed] bg-white/95 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#12345a] text-white text-sm font-bold">
              SC
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-sm tracking-tight truncate">Seyi Code</p>
              <p className="text-[10px] uppercase tracking-[0.14em] text-[#627184]">School OS</p>
            </div>
          </div>
          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/login"
              className="rounded-lg px-3 py-1.5 text-[#12345a] hover:bg-[#f0f4f8] font-medium"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-[#12345a] text-white px-3 py-1.5 font-medium hover:bg-[#1a3a6e]"
            >
              Open portal
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-5xl px-4 pt-14 pb-12 sm:pt-20 sm:pb-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#b3234b] mb-3">
            For African private schools
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-tight text-[#12345a] max-w-2xl">
            Run fees, classes, and parent portals in one place
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[#627184] max-w-xl leading-relaxed">
            Seyi Code powers multi-tenant school operations — from admissions to report cards —
            with a platform control plane for you and branded spaces for each school.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl bg-[#12345a] text-white px-5 py-3 text-sm font-semibold shadow-sm hover:bg-[#1a3a6e]"
            >
              Sign in to portal
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-xl border border-[#12345a]/20 bg-white px-5 py-3 text-sm font-semibold text-[#12345a] hover:border-[#12345a]/40"
            >
              Contact us
            </Link>
          </div>
        </section>

        <section className="border-y border-[#e3e8ed] bg-white">
          <div className="mx-auto max-w-5xl px-4 py-12 grid sm:grid-cols-2 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-[#e3e8ed] bg-[#f7f9fc] p-5 shadow-sm"
              >
                <span className="text-2xl" aria-hidden>
                  {f.icon}
                </span>
                <h2 className="mt-3 font-semibold text-[#12345a]">{f.title}</h2>
                <p className="mt-1.5 text-sm text-[#627184] leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-14 text-center">
          <h2 className="font-serif text-2xl text-[#12345a]">Already a school on the platform?</h2>
          <p className="mt-2 text-sm text-[#627184]">
            Use the staff, parent, or student portal with the account your school issued.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex rounded-xl bg-[#d2ae3b] text-[#12345a] px-5 py-3 text-sm font-bold shadow-sm hover:bg-[#c4a034]"
          >
            Portal sign in
          </Link>
        </section>
      </main>

      <footer className="border-t border-[#e3e8ed] bg-white py-8">
        <div className="mx-auto max-w-5xl px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-[#627184]">
          <p>
            <span className="font-semibold text-[#12345a]">Seyi Code</span> · School operations
            software
          </p>
          <p>Platform operators sign in with a platform admin account.</p>
        </div>
      </footer>
    </div>
  );
}
