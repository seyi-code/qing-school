/**
 * Per-school public marketing images.
 *
 * Isolation rules:
 * - KMS (flagship) → /kms-home/ (real school photos)
 * - Every other tenant → /campus/ neutral placeholders
 *   until they commit distinct files under /school-home/{slug}/
 *   and are listed in HAS_DISTINCT_PHOTOS.
 *
 * Never serve KMS people photos to DMS / Test / other tenants.
 */

const KMS_PREFIX = "/kms-home";
const NEUTRAL_PREFIX = "/campus";

/**
 * Only enable a slug here when public/school-home/{slug}/ has *their own*
 * photos (not copies of KMS). Until then non-KMS uses neutral campus.
 */
const HAS_DISTINCT_PHOTOS = new Set<string>([
  // "dms",
  // "test",
]);

function neutralFile(filename: string): string {
  if (
    filename.includes("hero") ||
    filename.includes("about") ||
    filename.includes("admission")
  ) {
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
    return isKms ? `${KMS_PREFIX}/${filename}` : neutralFile(filename);
  }

  if (isKms) return `${KMS_PREFIX}/${filename}`;

  if (HAS_DISTINCT_PHOTOS.has(s)) {
    return `/school-home/${s}/${filename}`;
  }

  return neutralFile(filename);
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
