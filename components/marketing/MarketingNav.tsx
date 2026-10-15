"use client";

import Link from "next/link";
import { useState } from "react";
import { SCHOOL } from "@/lib/school-config";

const LINKS = [
  { href: "/#about", label: "About Us" },
  { href: "/#programmes", label: "Academics" },
  { href: "/#why", label: "Why KMS" },
  { href: "/admissions", label: "Admissions" },
  { href: "/#news", label: "News" },
  { href: "/contact", label: "Contact" },
];

/**
 * Always-visible marketing chrome (matches standalone demo intent):
 * phone/portals + brand bar stay pinned while the page scrolls.
 * Uses position:fixed so mobile browsers cannot break it via overflow rules.
 */
export function MarketingNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50">
        {/* Utility strip */}
        <div className="bg-[#082442] text-[#eef4fb] text-[11px] sm:text-xs">
          <div className="max-w-[1180px] mx-auto px-4 sm:px-5 min-h-9 flex items-center justify-between gap-3 flex-wrap py-1.5">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <a href={`tel:${SCHOOL.contact.phone}`} className="hover:text-[#f2d66e]">
                {SCHOOL.contact.phone}
              </a>
              <a href={`mailto:${SCHOOL.contact.email}`} className="hover:text-[#f2d66e] hidden sm:inline">
                {SCHOOL.contact.email}
              </a>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 font-semibold">
              <Link href="/login" className="hover:text-[#f2d66e]">
                Student portal
              </Link>
              <Link href="/login" className="hover:text-[#f2d66e]">
                Parent portal
              </Link>
              <Link href="/login" className="hover:text-[#f2d66e]">
                Staff portal
              </Link>
            </div>
          </div>
        </div>

        {/* Brand bar */}
        <header className="bg-white/95 backdrop-blur-md border-b border-[#e3e8ed]">
          <div className="max-w-[1180px] mx-auto px-4 sm:px-5 min-h-[56px] sm:min-h-[72px] flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2.5 min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/kms-home/kms-school-crest.jpg"
                alt=""
                width={56}
                height={56}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-contain bg-[#f7f5ef] border border-[#e8e4d8] shrink-0"
              />
              <span className="min-w-0">
                <span className="block font-serif font-bold text-[#12345a] text-[14px] sm:text-lg leading-tight truncate">
                  {SCHOOL.name}
                </span>
                <span className="block text-[8px] sm:text-[10px] font-extrabold tracking-[0.16em] text-[#9a7820] uppercase mt-0.5">
                  {SCHOOL.motto}
                </span>
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-5">
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-[13px] font-bold text-[#29415c] hover:text-[#b3234b] whitespace-nowrap"
                >
                  {l.label}
                </Link>
              ))}
              <Link
                href="/admissions"
                className="inline-flex items-center px-4 py-2.5 rounded-lg bg-[#b3234b] text-white text-sm font-extrabold hover:brightness-95"
              >
                Apply Now
              </Link>
            </nav>

            <button
              type="button"
              className="lg:hidden w-10 h-10 rounded-lg border border-[#e3e8ed] bg-[#f6f5f0] text-[#12345a] text-xl shrink-0"
              aria-expanded={open}
              aria-label={open ? "Close navigation" : "Open navigation"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? "×" : "☰"}
            </button>
          </div>
          {open && (
            <div className="lg:hidden border-t border-[#e3e8ed] bg-white px-4 py-3 flex flex-col gap-2 max-h-[70vh] overflow-y-auto">
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="py-2 text-sm font-bold text-[#29415c]"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              ))}
              <Link
                href="/admissions"
                className="mt-1 text-center py-2.5 rounded-lg bg-[#b3234b] text-white text-sm font-extrabold"
                onClick={() => setOpen(false)}
              >
                Apply Now
              </Link>
              <Link
                href="/login"
                className="text-center py-2 text-sm font-bold text-[#12345a]"
                onClick={() => setOpen(false)}
              >
                Portal login
              </Link>
            </div>
          )}
        </header>
      </div>
      {/* Spacer matches fixed header height (utility + brand) */}
      <div className="h-[88px] sm:h-[100px]" aria-hidden />
    </>
  );
}
