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
  schoolSlug,
}: {
  branding: Branding;
  notices: Array<{ id: string; title: string; body: string; createdAt: Date }>;
  cmsHtml: string | null;
  cmsTitle: string | null;
  isTenantSite?: boolean;
  schoolSlug?: string | null;
}) {
  const admissionsHref = schoolSlug
    ? `/admissions?school=${encodeURIComponent(schoolSlug)}`
    : "/admissions";

  const primary = branding.primaryColor || "#12345a";
  const accent = branding.accentColor || "#d2ae3b";

  return (
    <main className="min-h-screen bg-white text-[#1e2e43] flex flex-col">
      <MarketingNav brand={branding} schoolSlug={schoolSlug} />
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

      {cmsHtml ? (
        <section className="py-12 sm:py-16 bg-[#f7f9fc]">
          <div className="max-w-[800px] mx-auto px-5 prose prose-sm">
            {cmsTitle ? <h2 className="font-serif text-2xl text-[#12345a]">{cmsTitle}</h2> : null}
            <div dangerouslySetInnerHTML={{ __html: cmsHtml }} />
          </div>
        </section>
      ) : null}

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
              About us
            </p>
            <h2 className="font-serif text-3xl text-[#12345a] mt-2 mb-4">
              {branding.name}
            </h2>
            <p className="text-[#627184] leading-relaxed mb-6">
              {branding.motto
                ? `${branding.motto}. A nurturing environment where every child learns, builds integrity, and discovers their purpose.`
                : "A nurturing environment where every child learns, builds integrity, and discovers their purpose."}
            </p>
            <Link
              href={admissionsHref}
              className="inline-flex items-center rounded-xl bg-[#b3234b] text-white px-5 py-3 text-sm font-bold hover:brightness-95"
            >
              Admissions →
            </Link>
          </div>
        </div>
      </section>

      <section id="programmes" className="py-16 bg-[#f7f9fc]">
        <div className="max-w-[1180px] mx-auto px-5">
          <p className="text-xs font-extrabold tracking-[0.16em] uppercase text-center" style={{ color: accent }}>
            Academics
          </p>
          <h2 className="font-serif text-3xl text-[#12345a] text-center mt-2 mb-10">Our programmes</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PROGRAMMES.map((p) => (
              <div key={p.title} className="bg-white rounded-xl overflow-hidden border border-[#e3e8ed] shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.img} alt="" className="h-36 w-full object-cover" />
                <div className="p-4">
                  <h3 className="font-bold text-[#12345a] m-0">{p.title}</h3>
                  <p className="text-xs text-[#627184] mt-1 mb-0">{p.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="why" className="py-16">
        <div className="max-w-[1180px] mx-auto px-5">
          <h2 className="font-serif text-3xl text-[#12345a] text-center mb-10">Why families choose us</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {WHY.map((w) => (
              <div key={w.title} className="rounded-xl border border-[#e3e8ed] p-6 bg-white">
                <span className="text-2xl" aria-hidden>
                  {w.icon}
                </span>
                <h3 className="font-bold text-[#12345a] mt-3">{w.title}</h3>
                <p className="text-sm text-[#627184] mt-1 mb-0">{w.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="news" className="py-16 bg-[#f0f4f8]">
        <div className="max-w-[1180px] mx-auto px-5">
          <p className="text-xs font-extrabold tracking-[0.16em] uppercase" style={{ color: accent }}>
            News
          </p>
          <h2 className="font-serif text-3xl text-[#12345a] mt-2 mb-8">
            Latest from {branding.shortName || branding.name}
          </h2>
          {notices.length === 0 ? (
            <p className="text-[#627184]">No public notices yet.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {notices.map((n) => (
                <article key={n.id} className="bg-white border border-[#e3e8ed] rounded-xl p-5">
                  <h3 className="font-bold text-[#12345a] m-0">{n.title}</h3>
                  <p className="text-sm text-[#627184] mt-2 mb-0 line-clamp-3">{n.body}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-14 text-center text-white" style={{ backgroundColor: primary }}>
        <p className="text-lg mb-4">Ready to join {branding.shortName || branding.name}?</p>
        <Link
          href={admissionsHref}
          className="inline-flex rounded-xl px-6 py-3 text-sm font-bold"
          style={{ backgroundColor: accent, color: "#12345a" }}
        >
          Start application
        </Link>
      </section>

      <MarketingFooter brand={branding} schoolSlug={schoolSlug} />
    </main>
  );
}
