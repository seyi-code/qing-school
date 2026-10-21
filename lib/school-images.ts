/**
 * Per-school public marketing images.
 *
 * Isolation rules:
 * - KMS (flagship) → /kms-home/
 * - Other tenants → /school-home/{slug}/ only if HAS_DISTINCT_PHOTOS
 *   otherwise neutral (campus or logo) — NEVER KMS people photos.
 */

const KMS_PREFIX = "/kms-home";
const NEUTRAL_PREFIX = "/campus";
const SAFE_PLACEHOLDER = "/logo.svg";

/**
 * Enable only when public/school-home/{slug}/ has *that school's*
 * photos (not KMS copies).
 */
const HAS_DISTINCT_PHOTOS = new Set<string>([
  // "dms",
  // "test",
]);

function neutralFile(_filename: string): string {
  // campus/*.jpg may not exist yet — logo is safe, never a KMS student photo
  return SAFE_PLACEHOLDER;
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
