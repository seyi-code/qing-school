import Link from "next/link";
import { SCHOOL } from "@/lib/school-config";

/** Shared public-site footer (matches homepage design). */
export function MarketingFooter() {
  return (
    <footer id="contact" className="bg-[#082442] text-[#d6e0ec] pt-12 pb-6 mt-auto">
      <div className="max-w-[1180px] mx-auto px-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/kms-home/kms-school-crest.jpg"
              alt=""
              width={48}
              height={48}
              className="w-12 h-12 rounded-full object-contain bg-white/10"
            />
            <span className="font-serif font-bold text-white text-lg leading-tight">{SCHOOL.name}</span>
          </div>
          <p className="text-sm text-[#a8b8c9]">
            {SCHOOL.motto}. Growing minds, building character and shaping tomorrow.
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
              Why {SCHOOL.shortName}
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
            <Link href="/complaints" className="hover:text-white">
              Feedback
            </Link>
          </div>
        </div>
        <div>
          <h3 className="text-white font-bold text-sm mb-3">Contact</h3>
          <p className="text-sm">{SCHOOL.contact.address}</p>
          <p className="text-sm mt-2">
            <a href={`tel:${SCHOOL.contact.phone}`} className="hover:text-white">
              {SCHOOL.contact.phone}
            </a>
          </p>
          <p className="text-sm">
            <a href={`mailto:${SCHOOL.contact.email}`} className="hover:text-white break-all">
              {SCHOOL.contact.email}
            </a>
          </p>
        </div>
      </div>
      <div className="max-w-[1180px] mx-auto px-5 pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-2 justify-between text-xs text-[#8a9aab]">
        <span>
          © {new Date().getFullYear()} {SCHOOL.name}. All rights reserved.
        </span>
        <strong className="text-[#d2ae3b] font-semibold">Knowledge · Character · Service</strong>
      </div>
    </footer>
  );
}
