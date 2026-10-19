import Link from "next/link";
import type { Branding } from "@/lib/branding";
import { HeroSlider } from "@/components/marketing/HeroSlider";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { SchoolImg } from "@/components/marketing/SchoolImg";
import { schoolImage, schoolProgrammeImages } from "@/lib/school-images";
import { presetForSlug } from "@/lib/school-presets";

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

  const preset = presetForSlug(schoolSlug);
  const primary = branding.primaryColor || preset.primary;
  const accent = branding.accentColor || preset.accent;
  const programmes = schoolProgrammeImages(schoolSlug).map((img, i) => ({
    ...img,
    title: preset.programmes[i]?.title ?? img.title,
    body: preset.programmes[i]?.body ?? img.body,
  }));
  const aboutSrc = schoolImage(schoolSlug, "about-students.jpg");
  const aboutFb = schoolImage(schoolSlug, "about-students.jpg", { forceDefault: true });
  const highlights = preset.highlights;

  return (
    <main className="min-h-screen bg-white text-[#1e2e43] flex flex-col">
      <MarketingNav brand={branding} schoolSlug={schoolSlug} />
      <HeroSlider brand={branding} schoolSlug={schoolSlug} />

      {/* 2×2 highlights */}
      <section style={{ backgroundColor: primary }} className="text-white">
        <div className="max-w-[1180px] mx-auto grid grid-cols-2 lg:grid-cols-4">
          {highlights.map((h, i) => (
            <div
              key={h.title}
              className={`flex items-start gap-3 px-4 sm:px-5 py-5 border-white/15 ${
                i % 2 === 0 ? "border-r" : ""
              } ${i < 2 ? "border-b lg:border-b-0" : ""} ${
                i < highlights.length - 1 ? "lg:border-r" : ""
              }`}
            >
              <span className="text-2xl sm:text-3xl shrink-0" style={{ color: accent }} aria-hidden>
                {h.icon}
              </span>
              <div>
                <h3 className="text-sm font-bold m-0">{h.title}</h3>
                <p className="text-[11px] text-white/80 m-0 mt-0.5 leading-snug">{h.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {cmsHtml ? (
        <section className="py-12 sm:py-16 bg-[#f7f9fc]">
          <div className="max-w-[800px] mx-auto px-5 prose prose-sm">
            {cmsTitle ? <h2 className="font-serif text-2xl" style={{ color: primary }}>{cmsTitle}</h2> : null}
            <div dangerouslySetInnerHTML={{ __html: cmsHtml }} />
          </div>
        </section>
      ) : null}

      {/* About */}
      <section id="about" className="py-16 sm:py-20">
        <div className="max-w-[1180px] mx-auto px-5 grid md:grid-cols-2 gap-10 items-center">
          <div className="relative h-[280px] sm:h-[390px] rounded-xl overflow-hidden shadow-md ring-1 ring-black/5">
            <SchoolImg
              src={aboutSrc}
              fallback={aboutFb}
              alt={branding.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="text-xs font-extrabold tracking-[0.16em] uppercase" style={{ color: accent }}>
              {preset.about.eyebrow}
            </p>
            <h2 className="font-serif text-3xl mt-2 mb-4 leading-tight" style={{ color: primary }}>
              {preset.about.title}{" "}
              <span style={{ color: "#b3234b" }}>{preset.about.titleAccent}</span>
            </h2>
            <p className="text-[#627184] leading-relaxed mb-4">
              {branding.name} {preset.about.body}
            </p>
            <p className="text-[#627184] leading-relaxed mb-6">
              {branding.motto ? (
                <>
                  Our motto, <strong style={{ color: primary }}>{branding.motto}</strong>,{" "}
                  {preset.about.mottoLine.replace(/^Our motto[^,]*,?\s*/i, "")}
                </>
              ) : (
                preset.about.mottoLine
              )}
            </p>
            <div className="flex flex-wrap gap-4 mb-6 text-xs font-semibold" style={{ color: accent }}>
              {preset.values.map((v) => (
                <span key={v.label} className="inline-flex items-center gap-1.5">
                  <span aria-hidden>{v.icon}</span>
                  {v.label}
                </span>
              ))}
            </div>
            <Link
              href={admissionsHref}
              className="inline-flex items-center rounded-xl text-white px-5 py-3 text-sm font-bold hover:brightness-95"
              style={{ backgroundColor: primary }}
            >
              Learn more about us →
            </Link>
          </div>
        </div>
      </section>

      {/* Programmes — always 2×2 (matches polished KMS video on mobile) */}
      <section id="programmes" className="py-16 bg-[#f7f9fc]">
        <div className="max-w-[1180px] mx-auto px-5">
          <p className="text-xs font-extrabold tracking-[0.16em] uppercase text-center" style={{ color: accent }}>
            Our programmes
          </p>
          <h2 className="font-serif text-3xl text-center mt-2 mb-3" style={{ color: primary }}>
            {preset.programmesIntro.title}
          </h2>
          <p className="text-center text-[#627184] max-w-2xl mx-auto mb-8 text-sm leading-relaxed">
            {preset.programmesIntro.body}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:gap-5">
            {programmes.map((p) => (
              <div
                key={p.title}
                className="bg-white rounded-xl overflow-hidden border border-[#e3e8ed] shadow-sm hover:shadow-md transition"
              >
                <SchoolImg
                  src={p.img}
                  fallback={p.fallback}
                  alt={p.title}
                  className="h-28 sm:h-40 w-full object-cover"
                />
                <div className="p-3 sm:p-4">
                  <h3 className="font-bold m-0 text-sm sm:text-base" style={{ color: primary }}>
                    {p.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-[#627184] mt-1 mb-2">{p.body}</p>
                  <span className="text-[11px] sm:text-xs font-bold" style={{ color: "#b3234b" }}>
                    Learn more →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why */}
      <section id="why" className="py-16">
        <div className="max-w-[1180px] mx-auto px-5">
          <p className="text-xs font-extrabold tracking-[0.16em] uppercase" style={{ color: accent }}>
            {preset.why.eyebrow}
          </p>
          <h2 className="font-serif text-3xl mt-2 mb-3" style={{ color: primary }}>
            {preset.why.title}
          </h2>
          <p className="text-[#627184] max-w-2xl mb-10 text-sm leading-relaxed">{preset.why.body}</p>
          <div className="grid md:grid-cols-3 gap-5">
            {preset.why.items.map((w) => (
              <div key={w.title} className="rounded-xl border border-[#e3e8ed] p-6 bg-white shadow-sm">
                <span className="text-2xl" aria-hidden>
                  {w.icon}
                </span>
                <h3 className="font-bold mt-3" style={{ color: primary }}>
                  {w.title}
                </h3>
                <p className="text-sm text-[#627184] mt-1 mb-0">{w.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Promise */}
      <section className="py-14 bg-[#faf6ee]">
        <div className="max-w-[800px] mx-auto px-5 text-center">
          <p className="text-xs font-extrabold tracking-[0.16em] uppercase mb-2" style={{ color: accent }}>
            Our promise
          </p>
          <h2 className="font-serif text-3xl mb-4 leading-tight" style={{ color: primary }}>
            {preset.promise.title}{" "}
            <span style={{ color: "#b3234b" }}>{preset.promise.titleAccent}</span>
          </h2>
          <p className="text-[#627184] leading-relaxed">{preset.promise.body}</p>
        </div>
      </section>

      {/* News */}
      <section id="news" className="py-16 bg-[#f0f4f8]">
        <div className="max-w-[1180px] mx-auto px-5">
          <p className="text-xs font-extrabold tracking-[0.16em] uppercase" style={{ color: accent }}>
            News
          </p>
          <h2 className="font-serif text-3xl mt-2 mb-8" style={{ color: primary }}>
            Latest from {branding.shortName || branding.name}
          </h2>
          {notices.length === 0 ? (
            <p className="text-[#627184] text-sm">
              Contact the school for current events, term dates and programme updates.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {notices.map((n) => (
                <article key={n.id} className="bg-white border border-[#e3e8ed] rounded-xl p-5">
                  <h3 className="font-bold m-0" style={{ color: primary }}>
                    {n.title}
                  </h3>
                  <p className="text-sm text-[#627184] mt-2 mb-0 line-clamp-3">{n.body}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Admissions CTA */}
      <section className="py-16 text-center text-white relative overflow-hidden" style={{ backgroundColor: primary }}>
        <div className="relative z-[1] max-w-[640px] mx-auto px-5">
          <p className="text-xs font-extrabold tracking-[0.16em] uppercase mb-2" style={{ color: accent }}>
            Admissions
          </p>
          <h2 className="font-serif text-3xl mb-3">Join our {branding.shortName || "school"} family.</h2>
          <p className="text-white/85 text-sm mb-6 leading-relaxed">
            Give your child the opportunity to learn, grow in character and build a brighter future.
          </p>
          <Link
            href={admissionsHref}
            className="inline-flex rounded-xl px-6 py-3 text-sm font-bold hover:brightness-95"
            style={{ backgroundColor: "#b3234b", color: "#fff" }}
          >
            {preset.hero.ctaAdmit}
          </Link>
        </div>
      </section>

      <MarketingFooter brand={branding} schoolSlug={schoolSlug} />
    </main>
  );
}
