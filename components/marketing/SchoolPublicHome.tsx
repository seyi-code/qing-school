import Link from "next/link";
import type { Branding } from "@/lib/branding";
import { HeroSlider } from "@/components/marketing/HeroSlider";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

const HIGHLIGHTS = [
  { icon: "📚", title: "Academic Excellence", body: "Quality education for a brighter future" },
  { icon: "🛡️", title: "Strong Values", body: "Integrity, discipline and godliness" },
  { icon: "👥", title: "Supportive Community", body: "Partnership between school and home" },
  { icon: "💻", title: "Modern Facilities", body: "A safe and conducive learning environment" },
];

const PROGRAMMES = [
  { title: "Early Years", body: "A strong foundation for lifelong success.", img: "/kms-home/early-years.jpg" },
  { title: "Primary School", body: "Building confidence and curiosity.", img: "/kms-home/primary-school.jpg" },
  { title: "Junior Secondary", body: "Developing skills for a brighter future.", img: "/kms-home/junior-secondary.jpg" },
  { title: "Senior Secondary", body: "Preparing leaders and innovators.", img: "/kms-home/senior-secondary.jpg" },
];

const WHY = [
  { title: "Experienced Teachers", body: "Passionate, qualified staff who know every child.", icon: "💛" },
  { title: "Safe Environment", body: "A secure and conducive learning atmosphere.", icon: "🏫" },
  { title: "Modern Facilities", body: "Well-equipped library, labs and more.", icon: "✨" },
];

export function SchoolPublicHome({
  branding,
  notices,
  cmsHtml,
  cmsTitle,
  isTenantSite,
}: {
  branding: Branding;
  notices: Array<{ id: string; title: string; body: string; createdAt: Date }>;
  cmsHtml: string | null;
  cmsTitle: string | null;
  isTenantSite?: boolean;
}) {
  const primary = branding.primaryColor || "#12345a";
  const accent = branding.accentColor || "#d2ae3b";

  return (
    <main className="min-h-screen bg-white text-[#1e2e43] flex flex-col">
      <MarketingNav brand={branding} />
      <HeroSlider brand={branding} />

      <section style={{ backgroundColor: primary }} className="text-white">
        <div className="max-w-[1180px] mx-auto grid grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map((h, i) => (
            <div
              key={h.title}
              className={`flex items-center gap-3 px-4 sm:px-5 py-5 ${
                i < HIGHLIGHTS.length - 1 ? "lg:border-r border-white/20" : ""
              }`}
            >
              <span className="text-2xl sm:text-3xl shrink-0" style={{ color: accent }} aria-hidden>
                {h.icon}
              </span>
              <div>
                <h3 className="text-sm font-bold m-0">{h.title}</h3>
                <p className="text-[11px] text-white/80 m-0 mt-0.5">{h.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="about" className="py-16 sm:py-20">
        <div className="max-w-[1180px] mx-auto px-5 grid md:grid-cols-2 gap-10 items-center">
          <div className="relative h-[280px] sm:h-[390px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/kms-home/about-students.jpg"
              alt={`Students at ${branding.name}`}
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          <div>
            <p className="text-xs font-extrabold tracking-[0.16em] uppercase" style={{ color: accent }}>
              About {branding.shortName}
            </p>
            <h2 className="font-serif text-[clamp(1.85rem,3.5vw,2.75rem)] leading-tight mt-2 mb-4" style={{ color: primary }}>
              More than education.
              <br />
              <em className="not-italic text-[#b3234b]">A foundation for life.</em>
            </h2>
            <p className="text-[#627184] text-[15px] leading-relaxed">
              {branding.name} is committed to excellent education that equips students with knowledge,
              skills and values.
              {branding.motto ? (
                <>
                  {" "}
                  <strong style={{ color: primary }}>{branding.motto}</strong>
                </>
              ) : null}
            </p>
            {isTenantSite ? (
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-[#627184]">
                School site · {branding.shortName}
              </p>
            ) : null}
            <Link
              href="/admissions"
              className="inline-flex mt-6 items-center gap-2 px-5 py-3 rounded-lg text-white text-sm font-extrabold"
              style={{ backgroundColor: primary }}
            >
              Admissions →
            </Link>
          </div>
        </div>
      </section>

      {cmsHtml ? (
        <section className="py-12 bg-[#f7f9fc] border-y border-[#e3e8ed]">
          <div className="max-w-[1180px] mx-auto px-5 prose prose-slate max-w-none">
            {cmsTitle ? (
              <h2 className="font-serif text-2xl mb-4" style={{ color: primary }}>
                {cmsTitle}
              </h2>
            ) : null}
            <div dangerouslySetInnerHTML={{ __html: cmsHtml }} />
          </div>
        </section>
      ) : null}

      <section id="programmes" className="py-16 sm:py-20 bg-gradient-to-br from-[#f0f6fb] to-[#fbfcfd]">
        <div className="max-w-[1180px] mx-auto px-5">
          <p className="text-xs font-extrabold tracking-[0.16em] uppercase" style={{ color: accent }}>
            Our programmes
          </p>
          <h2 className="font-serif text-[clamp(1.75rem,3vw,2.5rem)] mt-2 mb-8" style={{ color: primary }}>
            Holistic Education for Every Learner
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PROGRAMMES.map((p) => (
              <article key={p.title} className="rounded-xl overflow-hidden border border-[#e3e8ed] bg-white shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.img} alt={p.title} className="h-36 w-full object-cover" />
                <div className="p-4">
                  <h3 className="font-bold text-sm" style={{ color: primary }}>
                    {p.title}
                  </h3>
                  <p className="text-xs text-[#627184] mt-1">{p.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="why" className="py-16 sm:py-20">
        <div className="max-w-[1180px] mx-auto px-5">
          <p className="text-xs font-extrabold tracking-[0.16em] uppercase" style={{ color: accent }}>
            Why {branding.shortName}
          </p>
          <h2 className="font-serif text-[clamp(1.75rem,3vw,2.5rem)] mt-2 mb-8" style={{ color: primary }}>
            Why families choose us
          </h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {WHY.map((w) => (
              <div key={w.title} className="rounded-2xl border border-[#e3e8ed] p-5 bg-[#f7f9fc]">
                <span className="text-2xl" aria-hidden>
                  {w.icon}
                </span>
                <h3 className="font-bold mt-2" style={{ color: primary }}>
                  {w.title}
                </h3>
                <p className="text-sm text-[#627184] mt-1">{w.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="news" className="py-16 sm:py-20 bg-[#f0f6fb]">
        <div className="max-w-[1180px] mx-auto px-5">
          <p className="text-xs font-extrabold tracking-[0.16em] uppercase" style={{ color: accent }}>
            News
          </p>
          <h2 className="font-serif text-2xl mt-2 mb-6" style={{ color: primary }}>
            Latest from {branding.shortName}
          </h2>
          {notices.length === 0 ? (
            <p className="text-sm text-[#627184]">No public notices yet.</p>
          ) : (
            <ul className="grid sm:grid-cols-2 gap-4">
              {notices.map((n) => (
                <li key={n.id} className="rounded-xl border border-[#e3e8ed] bg-white p-4 shadow-sm">
                  <h3 className="font-bold text-sm" style={{ color: primary }}>
                    {n.title}
                  </h3>
                  <p className="text-xs text-[#627184] mt-1 line-clamp-3">{n.body}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="py-12 text-center" style={{ backgroundColor: primary }}>
        <p className="text-white/90 text-sm mb-4">Ready to join {branding.shortName}?</p>
        <Link
          href="/admissions"
          className="inline-flex px-6 py-3 rounded-lg font-extrabold text-sm"
          style={{ backgroundColor: accent, color: primary }}
        >
          Start application
        </Link>
      </section>

      <MarketingFooter brand={branding} />
    </main>
  );
}
