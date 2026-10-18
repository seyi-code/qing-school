import Link from "next/link";
import type { Branding } from "@/lib/branding";
import { defaultBranding } from "@/lib/branding";

export function MarketingFooter({ brand }: { brand?: Branding }) {
  const b = brand || defaultBranding();
  return (
    <footer className="bg-[#0c1f38] text-[#b8c5d4] pt-12 pb-8">
      <div className="max-w-[1180px] mx-auto px-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-10">
        <div>
          <p className="text-white font-extrabold text-base">{b.name}</p>
          <p className="text-xs text-[#d2ae3b] font-semibold mt-1 uppercase tracking-wide">
            {b.motto || b.shortName}
          </p>
          <p className="text-sm mt-3 leading-relaxed">
            Quality education rooted in character and service for every learner we serve.
          </p>
        </div>
        <div>
          <h3 className="text-white font-bold text-sm mb-3">Quick links</h3>
          <div className="flex flex-col gap-1.5 text-sm">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <Link href="/#about" className="hover:text-white">
              About Us
            </Link>
            <Link href="/#programmes" className="hover:text-white">
              Academics
            </Link>
            <Link href="/admissions" className="hover:text-white">
              Admissions
            </Link>
          </div>
        </div>
        <div>
          <h3 className="text-white font-bold text-sm mb-3">More</h3>
          <div className="flex flex-col gap-1.5 text-sm">
            <Link href="/#why" className="hover:text-white">
              Why {b.shortName}
            </Link>
            <Link href="/#news" className="hover:text-white">
              News & Events
            </Link>
            <Link href="/login" className="hover:text-white">
              Portal login
            </Link>
            <Link href="/result-checker" className="hover:text-white">
              Result checker
            </Link>
            <Link href="/contact" className="hover:text-white">
              Contact
            </Link>
          </div>
        </div>
        <div>
          <h3 className="text-white font-bold text-sm mb-3">Contact</h3>
          {b.address ? <p className="text-sm">{b.address}</p> : null}
          {b.phone ? (
            <p className="text-sm mt-2">
              <a href={`tel:${b.phone}`} className="hover:text-white">
                {b.phone}
              </a>
            </p>
          ) : null}
          {b.email ? (
            <p className="text-sm">
              <a href={`mailto:${b.email}`} className="hover:text-white break-all">
                {b.email}
              </a>
            </p>
          ) : null}
          <Link
            href="/contact"
            className="inline-block mt-2 text-sm text-[#d2ae3b] font-semibold hover:underline"
          >
            Message the office →
          </Link>
        </div>
      </div>
      <div className="max-w-[1180px] mx-auto px-5 pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-2 justify-between text-xs text-[#8a9aab]">
        <span>
          © {new Date().getFullYear()} {b.name}. All rights reserved.
        </span>
        <strong className="text-[#d2ae3b] font-semibold">Knowledge · Character · Service</strong>
      </div>
    </footer>
  );
}
