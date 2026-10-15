"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { SCHOOL } from "@/lib/school-config";

const SLIDES = [
  {
    src: "/kms-home/hero-classroom.jpg",
    alt: "Students learning in class at Kayvlop Magnificent School",
  },
  {
    src: "/kms-home/about-students.jpg",
    alt: "KMS students smiling with books",
  },
  {
    src: "/kms-home/admissions-students.jpg",
    alt: "Happy learners at KMS",
  },
];

export function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const show = useCallback((n: number) => {
    setIndex((n + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const t = setInterval(() => show(index + 1), 5000);
    return () => clearInterval(t);
  }, [index, paused, show]);

  return (
    <section
      className="relative bg-[#082442] text-white min-h-[min(520px,88vh)] overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="School highlights"
    >
      <div className="absolute inset-0">
        {SLIDES.map((s, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={s.src}
            src={s.src}
            alt={s.alt}
            className={`absolute inset-0 w-full h-full object-cover object-[center_38%] transition-opacity duration-700 ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={i !== index}
          />
        ))}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(4,23,44,.95) 0%, rgba(4,23,44,.80) 37%, rgba(4,23,44,.28) 68%, rgba(4,23,44,.08) 100%), linear-gradient(0deg, rgba(4,23,44,.48), transparent 55%)",
          }}
        />
      </div>

      <div className="relative z-[2] max-w-[1180px] mx-auto px-5 sm:px-6 min-h-[min(520px,88vh)] flex items-center py-14 sm:py-16">
        <div className="max-w-xl">
          <p className="text-[11px] sm:text-xs font-extrabold tracking-[0.18em] uppercase text-[#d2ae3b] flex items-center gap-2.5">
            <span className="inline-block w-7 h-0.5 bg-[#d2ae3b]" />
            Welcome to {SCHOOL.shortName}
          </p>
          <h1 className="font-serif text-[clamp(2.35rem,6vw,4.25rem)] leading-[1.05] tracking-tight mt-3 mb-4 text-white">
            Growing minds.
            <br />
            <span className="text-[#f1d264]">Building character.</span>
            <br />
            Shaping tomorrow.
          </h1>
          <p className="text-[15px] sm:text-base text-[#e2eaf3] max-w-md mb-6 leading-relaxed">
            At {SCHOOL.name}, we provide a nurturing and inspiring environment where every child
            learns, builds integrity, grows in faith and discovers their purpose.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admissions"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#b3234b] text-white text-sm font-extrabold hover:brightness-95 transition"
            >
              Explore Our School →
            </Link>
            <Link
              href="/admissions"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg border border-white text-white text-sm font-extrabold hover:bg-white/10 transition"
            >
              Admissions Enquiry
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute right-4 bottom-8 z-[3] hidden sm:flex items-center gap-2.5 bg-white text-[#12345a] px-3.5 py-2.5 rounded-xl shadow-lg text-xs font-extrabold">
        <span className="text-2xl text-[#d2ae3b]">🎓</span>
        <span>
          Education with Godliness
          <br />
          <span className="font-semibold text-[#627184]">Knowledge · Character · Service</span>
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
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === index}
            onClick={() => show(i)}
            className={`h-2 rounded-full transition-all ${
              i === index ? "w-7 bg-[#f1d264]" : "w-2 bg-white/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
