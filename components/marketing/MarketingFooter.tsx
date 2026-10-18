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
  return (
    <footer className="bg-[#0c1f38] text-[#b8c5d4] pt-12 pb-8">
      <div className="max-w-[1180px] mx-auto px-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <p className="text-white font-semibold text-sm mb-1">{b.name}</p>
          <p className="text-[#d2ae3b] text-xs uppercase tracking-wide mb-3">{b.motto}</p>
          <p className="text-xs leading-relaxed opacity-80">
            Quality education rooted in character and service for every learner we serve.
          </p>
        </div>
        <div>
          <p className="text-white text-xs font-semibold uppercase tracking-wide mb-3">Quick links</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href={home} className="hover:text-white">
                Home
              </Link>
            </li>
            <li>
              <Link href={`${home}#about`} className="hover:text-white">
                About
              </Link>
            </li>
            <li>
              <Link href={`${home}#programmes`} className="hover:text-white">
                Academics
              </Link>
            </li>
            <li>
              <Link href={admissionsHref} className="hover:text-white">
                Admissions
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-white text-xs font-semibold uppercase tracking-wide mb-3">Explore</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href={`${home}#why`} className="hover:text-white">
                Why us
              </Link>
            </li>
            <li>
              <Link href={`${home}#news`} className="hover:text-white">
                News
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-white">
                Portal login
              </Link>
            </li>
            <li>
              <Link href="/result-checker" className="hover:text-white">
                Result checker
              </Link>
            </li>
            <li>
              <Link href={contactHref} className="hover:text-white">
                Contact
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-white text-xs font-semibold uppercase tracking-wide mb-3">Contact</p>
          <ul className="space-y-2 text-sm">
            {b.phone ? (
              <li>
                <a href={`tel:${b.phone}`} className="hover:text-white">
                  {b.phone}
                </a>
              </li>
            ) : null}
            {b.email ? (
              <li>
                <a href={`mailto:${b.email}`} className="hover:text-white break-all">
                  {b.email}
                </a>
              </li>
            ) : null}
            {b.address ? <li className="opacity-80 text-xs">{b.address}</li> : null}
            <li>
              <Link href={contactHref} className="hover:text-white underline text-xs">
                Contact form
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="max-w-[1180px] mx-auto px-5 mt-10 pt-6 border-t border-white/10 text-xs opacity-60">
        © {new Date().getFullYear()} {b.name}. All rights reserved.
      </div>
    </footer>
  );
}
