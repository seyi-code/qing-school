/**
 * Per-school public marketing images.
 *
 * - KMS → /kms-home/ (flagship)
 * - DMS → /school-home/dms/ (existing pack; no hero-group.jpg — mapped carefully)
 * - Test → /school-home/dms/ until test has its own files (folder is empty now)
 * - Never point non-KMS at broken empty folders without a working fallback
 */

const KMS_PREFIX = "/kms-home";
const DMS_PREFIX = "/school-home/dms";

function packPrefix(slug: string | null | undefined): string {
  if (!slug) return KMS_PREFIX;
  const s = slug.trim().toLowerCase();
  if (!s || s === "kms") return KMS_PREFIX;
  // test has no committed jpgs yet — use DMS pack so images are not broken
  if (s === "test" || s === "dms") return DMS_PREFIX;
  return `/school-home/${s}`;
}

export function schoolImage(
  slug: string | null | undefined,
  filename: string,
  options?: { forceDefault?: boolean }
): string {
  const s = (slug || "").trim().toLowerCase();
  const isKms = !s || s === "kms";

  if (options?.forceDefault) {
    if (isKms) return `${KMS_PREFIX}/${filename}`;
    // Safe working pack for any non-KMS tenant
    return `${DMS_PREFIX}/${filename}`;
  }

  return `${packPrefix(s)}/${filename}`;
}

/**
 * Hero slides — only files that exist in each pack.
 * DMS pack has no hero-group.jpg; using why-classroom avoids a duplicate about-students slide.
 */
export function schoolHeroSlides(slug: string | null | undefined) {
  const s = (slug || "").trim().toLowerCase();
  const isKms = !s || s === "kms";
  const label = s && s !== "kms" ? s.toUpperCase() : "school";

  if (isKms) {
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

  // DMS / Test: only filenames present under school-home/dms
  return [
    {
      src: schoolImage(slug, "hero-classroom.jpg"),
      fallback: schoolImage(slug, "hero-classroom.jpg", { forceDefault: true }),
      alt: `Students learning at ${label}`,
    },
    {
      src: schoolImage(slug, "why-classroom.jpg"),
      fallback: schoolImage(slug, "hero-classroom.jpg", { forceDefault: true }),
      alt: `Learning spaces at ${label}`,
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
