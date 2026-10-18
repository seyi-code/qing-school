"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Branding } from "@/lib/branding";
import { defaultBranding } from "@/lib/branding";
import { schoolHeroSlides } from "@/lib/school-images";
import { presetForSlug } from "@/lib/school-presets";

export function HeroSlider({
  brand,
  schoolSlug,
}: {
  brand?: Branding;
  schoolSlug?: string | null;
}) {
  const b = brand || defaultBranding();
  const preset = presetForSlug(schoolSlug);
  const hero = preset.hero;
  const slides = schoolHeroSlides(schoolSlug);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const home = schoolSlug ? `/site/${schoolSlug}` : "/";
  const admissionsHref = schoolSlug
    ? `/admissions?school=${encodeURIComponent(schoolSlug)}`
    : "/admissions";

  const show = useCallback(
    (n: number) => {
      setIndex((n + slides.length) % slides.length);
    },
    [slides.length]
  );

  useEffect(() => {
    if (paused) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 5000);
    return () => clearInterval(t);
  }, [paused, slides.length]);

  const accent = b.accentColor || preset.accent;
  const titleClass =
    preset.font === "sans"
      ? "font-sans text-white text-[clamp(2rem,5vw,3.25rem)] leading-tight mb-4 font-bold"
      : "font-serif text-white text-[clamp(2rem,5vw,3.25rem)] leading-tight mb-4";

  return (
    <section
      className="relative min-h-[420px] sm:min-h-[520px] overflow-hidden bg-[#0c1f38]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((s, i) => (
        <div
          key={s.src + i}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === index ? "opacity-100 z-[1]" : "opacity-0 z-0"
          }`}
          aria-hidden={i !== index}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={s.src}
            alt={s.alt}
            className="w-full h-full object-cover"
            onError={(e) => {
              const el = e.currentTarget;
              if (el.dataset.fb === "1") return;
              el.dataset.fb = "1";
              el.src = s.fallback;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0c1f38]/90 via-[#0c1f38]/55 to-transparent" />
        </div>
      ))}

      <div className="relative z-[2] max-w-[1180px] mx-auto px-5 py-16 sm:py-24">
        <div className="max-w-xl">
          <p
            className="text-xs font-extrabold tracking-[0.16em] uppercase mb-3"
            style={{ color: accent }}
          >
            Welcome to {b.shortName}
          </p>
          <h1 className={titleClass}>
            {hero.line1}
            <br />
            <span style={{ color: accent }}>{hero.line2}</span>
            <br />
            {hero.line3}
          </h1>
          <p className="text-[15px] sm:text-base text-[#e2eaf3] max-w-md mb-6 leading-relaxed">
            At {b.name}, {hero.blurb.replace(/^At [^,]+,\s*/i, "")}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`${home}#about`}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-white text-sm font-extrabold hover:brightness-95 transition"
              style={{ backgroundColor: preset.tone === "modern" ? preset.primary : "#b3234b" }}
            >
              {hero.ctaExplore}
            </Link>
            <Link
              href={admissionsHref}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg border border-white text-white text-sm font-extrabold hover:bg-white/10 transition"
            >
              {hero.ctaAdmit}
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute right-4 bottom-8 z-[3] hidden sm:flex items-center gap-2.5 bg-white text-[#12345a] px-3.5 py-2.5 rounded-xl shadow-lg text-xs font-extrabold">
        <span className="text-2xl" style={{ color: accent }}>
          🎓
        </span>
        <span>
          {b.motto || "Excellence in learning"}
          <br />
          <span className="font-semibold text-[#627184]">{b.shortName}</span>
        </span>
      </div>

      <button
        type="button"
        aria-label="Previous slide"
        onClick={() => show(index - 1)}
        className="absolute z-[4] top-1/2 -translate-y-1/2 left-3 w-10 h-10 rounded-full border border-white/40 bg-white/15 text-white text-xl hover:bg-white/25"
      >
        ‹
      </button>
      <button
        type="button"
        aria-label="Next slide"
        onClick={() => show(index + 1)}
        className="absolute z-[4] top-1/2 -translate-y-1/2 right-3 w-10 h-10 rounded-full border border-white/40 bg-white/15 text-white text-xl hover:bg-white/25"
      >
        ›
      </button>
      <div className="absolute z-[4] bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === index}
            onClick={() => show(i)}
            className={`h-2 rounded-full transition-all ${
              i === index ? "w-6 bg-white" : "w-2 bg-white/50"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
