/**
 * Per-school public marketing images.
 * Place assets under public/school-home/{slug}/ then fall back to public/kms-home/.
 *
 * Expected filenames (optional per school):
 *   hero-classroom.jpg | about-students.jpg | admissions-students.jpg
 *   early-years.jpg | primary-school.jpg | junior-secondary.jpg | senior-secondary.jpg
 */

const DEFAULT_PREFIX = "/kms-home";

function prefixFor(slug: string | null | undefined): string {
  if (!slug) return DEFAULT_PREFIX;
  const s = slug.trim().toLowerCase();
  if (!s || s === "kms") return DEFAULT_PREFIX;
  // Prefer dedicated folder; browser 404 falls back via onError where wired,
  // but we also allow schools that only customize some files.
  return `/school-home/${s}`;
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
      alt: "Students learning in class",
    },
    {
      src: schoolImage(slug, "about-students.jpg"),
      fallback: schoolImage(slug, "about-students.jpg", { forceDefault: true }),
      alt: "Students smiling with books",
    },
    {
      src: schoolImage(slug, "admissions-students.jpg"),
      fallback: schoolImage(slug, "admissions-students.jpg", { forceDefault: true }),
      alt: "Happy learners",
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
