/**
 * Per-school public marketing images.
 *
 * Isolation rules:
 * - KMS (flagship) → /kms-home/
 * - Other schools → /school-home/{slug}/ first, then /dms-home/ only for slug "dms",
 *   then neutral /campus/ — NEVER fall back to KMS people photos for other tenants.
 */

const KMS_PREFIX = "/kms-home";
const NEUTRAL_PREFIX = "/campus";

/** Slugs that have committed assets under public/school-home/{slug}/ */
const HAS_SCHOOL_HOME = new Set<string>(["dms", "test"]);

function prefixFor(slug: string | null | undefined): string {
  if (!slug) return KMS_PREFIX;
  const s = slug.trim().toLowerCase();
  if (!s || s === "kms") return KMS_PREFIX;
  if (HAS_SCHOOL_HOME.has(s)) return `/school-home/${s}`;
  if (s === "dms") return "/dms-home";
  return `/school-home/${s}`;
}

/** Neutral fallback — never use KMS student photos for other schools. */
function neutralFallback(filename: string): string {
  // Map marketing filenames to campus placeholders when present
  if (filename.includes("hero") || filename.includes("about") || filename.includes("admission")) {
    return `${NEUTRAL_PREFIX}/hero.jpg`;
  }
  if (filename.includes("early") || filename.includes("primary")) {
    return `${NEUTRAL_PREFIX}/grounds-1.jpg`;
  }
  return `${NEUTRAL_PREFIX}/grounds-2.jpg`;
}

export function schoolImage(
  slug: string | null | undefined,
  filename: string,
  options?: { forceDefault?: boolean }
): string {
  const s = (slug || "").trim().toLowerCase();
  const isKms = !s || s === "kms";

  if (options?.forceDefault) {
    // forceDefault means KMS pack only for KMS; neutral for everyone else
    return isKms ? `${KMS_PREFIX}/${filename}` : neutralFallback(filename);
  }

  if (isKms) return `${KMS_PREFIX}/${filename}`;
  return `${prefixFor(s)}/${filename}`;
}

export function schoolHeroSlides(slug: string | null | undefined) {
  const s = (slug || "").trim().toLowerCase();
  const label = s && s !== "kms" ? s.toUpperCase() : "school";
  return [
    {
      src: schoolImage(slug, "hero-classroom.jpg"),
      fallback: schoolImage(slug, "hero-classroom.jpg", { forceDefault: true }),
      alt: `Students learning at ${label}`,
    },
    {
      src: schoolImage(slug, "hero-group.jpg"),
      fallback: schoolImage(slug, "about-students.jpg", { forceDefault: true }),
      alt: `School community at ${label}`,
    },
    {
      src: schoolImage(slug, "about-students.jpg"),
      fallback: schoolImage(slug, "about-students.jpg", { forceDefault: true }),
      alt: "Students and staff together",
    },
    {
      src: schoolImage(slug, "admissions-students.jpg"),
      fallback: schoolImage(slug, "admissions-students.jpg", { forceDefault: true }),
      alt: "Celebrating achievement",
    },
  ];
}

export function schoolProgrammeImages(slug: string | null | undefined) {
  return [
    {
      title: "Early Years",
      body: "A strong foundation for lifelong success.",
      img: schoolImage(slug, "early-years.jpg"),
      fallback: schoolImage(slug, "early-years.jpg", { forceDefault: true }),
    },
    {
      title: "Primary School",
      body: "Building confidence and curiosity.",
      img: schoolImage(slug, "primary-school.jpg"),
      fallback: schoolImage(slug, "primary-school.jpg", { forceDefault: true }),
    },
    {
      title: "Junior Secondary",
      body: "Developing skills for a brighter future.",
      img: schoolImage(slug, "junior-secondary.jpg"),
      fallback: schoolImage(slug, "junior-secondary.jpg", { forceDefault: true }),
    },
    {
      title: "Senior Secondary",
      body: "Preparing leaders and innovators.",
      img: schoolImage(slug, "senior-secondary.jpg"),
      fallback: schoolImage(slug, "senior-secondary.jpg", { forceDefault: true }),
    },
  ];
}
