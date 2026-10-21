"use client";

import Link from "next/link";
import { useState } from "react";
import type { Branding } from "@/lib/branding";
import { defaultBranding } from "@/lib/branding";
import { DarkModeToggle } from "./DarkModeToggle";

/** Optional `brand` enables per-school white-label (Phase 1b+). */
export function MarketingNav({
  brand,
  schoolSlug,
}: {
  brand?: Branding;
  schoolSlug?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const b = brand || defaultBranding();
  const home = schoolSlug ? `/site/${schoolSlug}` : "/";
  const admissionsHref = schoolSlug
    ? `/admissions?school=${encodeURIComponent(schoolSlug)}`
    : "/admissions";
  const contactHref = schoolSlug
    ? `/contact?school=${encodeURIComponent(schoolSlug)}`
    : "/contact";
  const loginHref = schoolSlug
    ? `/login?school=${encodeURIComponent(schoolSlug)}`
    : "/login";
  const LINKS = [
    { href: `${home}#about`, label: "About Us" },
    { href: `${home}#programmes`, label: "Academics" },
    { href: `${home}#why`, label: `Why ${b.shortName}` },
    { href: admissionsHref, label: "Admissions" },
    { href: `${home}#news`, label: "News" },
    { href: contactHref, label: "Contact" },
  ];

  const socials = [
    { href: b.socialFacebook, label: "Facebook", glyph: "f" },
    { href: b.socialInstagram, label: "Instagram", glyph: "◉" },
    { href: b.socialYoutube, label: "YouTube", glyph: "▶" },
  ].filter((s) => s.href);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="bg-[#082442] text-[#eef4fb] text-[11px] sm:text-xs">
          <div className="max-w-[1180px] mx-auto px-4 sm:px-5 min-h-9 flex items-center justify-between gap-3 flex-wrap py-1.5">
            <div className="flex flex-wrap gap-x-4 gap-y-1 items-center">
              {b.phone ? (
                <a href={`tel:${b.phone}`} className="hover:text-[#f2d66e]">
                  {b.phone}
                </a>
              ) : null}
              {b.email ? (
                <a href={`mailto:${b.email}`} className="hover:text-[#f2d66e] hidden sm:inline">
                  {b.email}
                </a>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-6 h-6 rounded-full border border-white/30 flex items-center justify-center text-[10px] font-bold hover:bg-white/10 hover:border-[#f2d66e]"
                >
                  {s.glyph}
                </a>
              ))}
              {socials.length > 0 ? (
                <span className="hidden sm:inline text-white/30">|</span>
              ) : null}
              <Link href={loginHref} className="font-semibold hover:text-[#f2d66e]">
                Portal login
              </Link>
            </div>
          </div>
        </div>

        <header className="bg-white/95 dark:bg-[#0f1c2e]/95 backdrop-blur-md border-b border-[#e3e8ed] dark:border-white/10">
          <div className="max-w-[1180px] mx-auto px-4 sm:px-5 min-h-[56px] sm:min-h-[72px] flex items-center justify-between gap-4">
            <Link href={home} className="flex items-center gap-2.5 min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={b.logoUrl || "/logo.svg"}
                alt=""
                className="w-9 h-9 sm:w-10 sm:h-10 object-contain shrink-0"
                onError={(e) => {
                  const el = e.currentTarget;
                  if (el.dataset.fb === "1") return;
                  el.dataset.fb = "1";
                  el.src = "/logo.svg";
                }}
              />
              <span className="min-w-0">
                <span className="block font-serif font-bold text-[#12345a] dark:text-[#e8eef5] text-[14px] sm:text-lg leading-tight truncate">
                  {b.name}
                </span>
                <span className="block text-[8px] sm:text-[10px] font-extrabold tracking-[0.16em] text-[#9a7820] uppercase mt-0.5">
                  {b.motto || b.shortName}
                </span>
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-5">
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-[13px] font-bold text-[#29415c] dark:text-[#c5d0dc] hover:text-[#b3234b] whitespace-nowrap"
                >
                  {l.label}
                </Link>
              ))}
              <Link
                href={admissionsHref}
                className="inline-flex items-center px-4 py-2.5 rounded-lg bg-[#b3234b] text-white text-sm font-extrabold hover:brightness-95"
              >
                Apply Now
              </Link>
              <DarkModeToggle />
            </nav>

            <div className="flex items-center gap-2 lg:hidden">
              <DarkModeToggle />
              <button
                type="button"
                className="w-10 h-10 rounded-lg border border-[#e3e8ed] dark:border-white/15 bg-[#f6f5f0] dark:bg-white/10 text-[#12345a] dark:text-[#e8eef5] text-xl shrink-0"
                aria-expanded={open}
                aria-label={open ? "Close navigation" : "Open navigation"}
                onClick={() => setOpen((v) => !v)}
              >
                {open ? "×" : "☰"}
              </button>
            </div>
          </div>
          {open && (
            <div className="lg:hidden border-t border-[#e3e8ed] dark:border-white/10 bg-white dark:bg-[#0f1c2e] px-4 py-3 flex flex-col gap-2 max-h-[70vh] overflow-y-auto">
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="py-2 text-sm font-bold text-[#29415c] dark:text-[#c5d0dc]"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              ))}
              <Link
                href={admissionsHref}
                className="mt-1 text-center py-2.5 rounded-lg bg-[#b3234b] text-white text-sm font-extrabold"
                onClick={() => setOpen(false)}
              >
                Apply Now
              </Link>
              <Link
                href={loginHref}
                className="text-center py-2 text-sm font-bold text-[#12345a] dark:text-[#e8eef5]"
                onClick={() => setOpen(false)}
              >
                Portal login
              </Link>
            </div>
          )}
        </header>
      </div>
      <div className="h-[88px] sm:h-[100px]" aria-hidden />
    </>
  );
}
