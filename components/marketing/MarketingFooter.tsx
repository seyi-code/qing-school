import Link from "next/link";
import type { Branding } from "@/lib/branding";
import { defaultBranding } from "@/lib/branding";

export function MarketingFooter({
  brand,
  schoolSlug,
}: {
  brand?: Branding;
  schoolSlug?: string | null;
}) {
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

  return (
    <footer className="bg-[#0c1f38] text-[#b8c5d4] pt-12 pb-8">
      <div className="max-w-[1180px] mx-auto px-5">
        {/* 3 columns on desktop: Brand+socials | Quick Links | Discover */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12 mb-10">
          {/* Brand + socials */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={b.logoUrl || "/logo.svg"}
                alt=""
                className="w-11 h-11 object-contain rounded-full bg-white/10 shrink-0"
              />
              <p className="text-white font-semibold text-sm m-0 leading-snug">{b.name}</p>
            </div>
            <p className="text-xs leading-relaxed opacity-90 mb-5 max-w-xs">
              {b.motto ? `${b.motto}. ` : ""}
              Growing minds, building character and shaping tomorrow.
            </p>
            <p className="text-white text-[10px] font-semibold uppercase tracking-wide mb-2.5">
              Stay connected
            </p>
            <div className="flex gap-2.5">
              <a
                href="#"
                aria-label="Facebook"
                className="w-9 h-9 rounded-full border border-white/25 flex items-center justify-center text-sm font-bold text-white hover:bg-white/10 hover:border-[#d2ae3b] transition"
              >
                f
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="w-9 h-9 rounded-full border border-white/25 flex items-center justify-center text-sm text-white hover:bg-white/10 hover:border-[#d2ae3b] transition"
              >
                ◉
              </a>
              <a
                href="#"
                aria-label="YouTube"
                className="w-9 h-9 rounded-full border border-white/25 flex items-center justify-center text-xs text-white hover:bg-white/10 hover:border-[#d2ae3b] transition"
              >
                ▶
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <p className="text-white text-xs font-semibold uppercase tracking-wide mb-3">
              Quick Links
            </p>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href={home} className="hover:text-white transition">
                  Home
                </Link>
              </li>
              <li>
                <Link href={`${home}#about`} className="hover:text-white transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link href={`${home}#programmes`} className="hover:text-white transition">
                  Academics
                </Link>
              </li>
              <li>
                <Link href={admissionsHref} className="hover:text-white transition">
                  Admissions
                </Link>
              </li>
            </ul>
          </div>

          {/* Discover */}
          <div>
            <p className="text-white text-xs font-semibold uppercase tracking-wide mb-3">
              Discover {b.shortName}
            </p>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href={`${home}#why`} className="hover:text-white transition">
                  Why {b.shortName}
                </Link>
              </li>
              <li>
                <Link href={`${home}#about`} className="hover:text-white transition">
                  Mission & Values
                </Link>
              </li>
              <li>
                <Link href={contactHref} className="hover:text-white transition">
                  Contact
                </Link>
              </li>
              <li>
                <Link href={loginHref} className="hover:text-white transition">
                  Portal login
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          <p className="m-0 opacity-80">
            © {new Date().getFullYear()} {b.name}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-[#d2ae3b] font-semibold tracking-wide">
              Knowledge · Character · Service
            </span>
            <a href="#" className="hover:text-white underline-offset-2 hover:underline">
              Back to top ↑
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
