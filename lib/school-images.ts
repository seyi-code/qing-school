/**
 * Per-school public marketing images.
 * KMS (flagship) uses /kms-home/ — replace those files with real school photos.
 * Only slugs in HAS_CUSTOM_IMAGES use /school-home/{slug}/.
 * Everyone else falls back to /kms-home/ (no broken images).
 */

const DEFAULT_PREFIX = "/kms-home";

/** Slu gs that have real files under public/school-home/{slug}/ */
const HAS_CUSTOM_IMAGES = new Set<string>([
  // "dms", // enable when distinct DMS files are committed
  // "test",
]);

function prefixFor(slug: string | null | undefined): string {
  if (!slug) return DEFAULT_PREFIX;
  const s = slug.trim().toLowerCase();
  if (!s || s === "kms") return DEFAULT_PREFIX;
  if (HAS_CUSTOM_IMAGES.has(s)) return `/school-home/${s}`;
  return DEFAULT_PREFIX;
}

export function schoolImage(
  slug: string | null | undefined,
  filename: string,
  options?: { forceDefault?: boolean }
): string {
  if (options?.forceDefault) return `${DEFAULT_PREFIX}/${filename}`;
  return `${prefixFor(slug)}/${filename}`;
}

export function schoolHeroSlides(slug: string | null | undefined) {
  return [
    {
      src: schoolImage(slug, "hero-classroom.jpg"),
      fallback: schoolImage(slug, "hero-classroom.jpg", { forceDefault: true }),
      alt: "Kayvlop students in science practical",
    },
    {
      src: schoolImage(slug, "hero-group.jpg"),
      fallback: schoolImage(slug, "about-students.jpg", { forceDefault: true }),
      alt: "Kayvlop Magnificent School community",
    },
    {
      src: schoolImage(slug, "about-students.jpg"),
      fallback: schoolImage(slug, "about-students.jpg", { forceDefault: true }),
      alt: "Students and staff together",
    },
    {
      src: schoolImage(slug, "admissions-students.jpg"),
      fallback: schoolImage(slug, "admissions-students.jpg", { forceDefault: true }),
      alt: "Celebrating achievement at Kayvlop",
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
