/**
 * Per-school public marketing images.
 *
 * - KMS → /kms-home/ (flagship real photos)
 * - DMS → /school-home/dms/ (existing DMS pack; not KMS real people)
 * - Test → /school-home/test/ when present, else /school-home/dms/ style paths
 * - Other unknown slugs → /school-home/{slug}/ (no silent KMS people fallback)
 */

const KMS_PREFIX = "/kms-home";

/** Tenants with files under public/school-home/{slug}/ */
const SCHOOL_HOME_SLUGS = new Set<string>(["dms", "test"]);

function prefixFor(slug: string | null | undefined): string {
  if (!slug) return KMS_PREFIX;
  const s = slug.trim().toLowerCase();
  if (!s || s === "kms") return KMS_PREFIX;
  if (SCHOOL_HOME_SLUGS.has(s)) return `/school-home/${s}`;
  // Prefer tenant folder path (empty → broken img → onError fallback), never KMS people
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
    // KMS pack only for KMS. Other schools fall back within their own folder
    // or the shared DMS stock pack — not KMS real photos.
    if (isKms) return `${KMS_PREFIX}/${filename}`;
    if (SCHOOL_HOME_SLUGS.has(s)) return `/school-home/${s}/${filename}`;
    return `/school-home/dms/${filename}`;
  }

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
