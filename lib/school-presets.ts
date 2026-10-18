/**
 * Per-school public design presets (polish).
 * Colors still come from School.primaryColor / accentColor when set;
 * preset fills gaps and drives layout / default hero set.
 */

export type LayoutPresetId = "classic" | "montessori" | "modern";

export type SchoolPreset = {
  id: LayoutPresetId;
  label: string;
  primary: string;
  accent: string;
  font: "serif" | "sans";
  /** Relative paths under /public — override with CMS media when ready */
  heroImages: string[];
  aboutImage: string;
  tone: "formal" | "warm" | "fresh";
};

export const PRESETS: Record<LayoutPresetId, SchoolPreset> = {
  classic: {
    id: "classic",
    label: "Classic formal",
    primary: "#12345a",
    accent: "#d2ae3b",
    font: "serif",
    heroImages: [
      "/kms-home/hero-classroom.jpg",
      "/kms-home/about-students.jpg",
      "/kms-home/admissions-students.jpg",
    ],
    aboutImage: "/kms-home/about-students.jpg",
    tone: "formal",
  },
  montessori: {
    id: "montessori",
    label: "Montessori warm",
    primary: "#5c3d2e",
    accent: "#c4783a",
    font: "serif",
    heroImages: [
      "/presets/montessori-hero.jpg",
      "/presets/montessori-about.jpg",
      "/presets/montessori-learn.jpg",
    ],
    aboutImage: "/presets/montessori-about.jpg",
    tone: "warm",
  },
  modern: {
    id: "modern",
    label: "Modern fresh",
    primary: "#0f3d3e",
    accent: "#2dd4bf",
    font: "sans",
    heroImages: [
      "/presets/modern-hero.jpg",
      "/presets/modern-about.jpg",
      "/presets/modern-campus.jpg",
    ],
    aboutImage: "/presets/modern-about.jpg",
    tone: "fresh",
  },
};

/** Map known school slugs → preset. Unknown schools get classic. */
export const SLUG_PRESET: Record<string, LayoutPresetId> = {
  kms: "classic",
  dms: "montessori",
  test: "modern",
};

export function presetForSlug(slug: string | null | undefined): SchoolPreset {
  const id = (slug && SLUG_PRESET[slug.toLowerCase()]) || "classic";
  return PRESETS[id];
}

/** Suggested CMS homepage blocks (paste / recreate in editor). */
export const CONTENT_PACKS: Record<
  string,
  {
    title: string;
    metaTitle: string;
    metaDescription: string;
    blocks: Array<Record<string, unknown>>;
  }
> = {
  dms: {
    title: "Welcome to DEBTEB Montessori",
    metaTitle: "DEBTEB Montessori School | Education with Godliness",
    metaDescription:
      "A nurturing Montessori environment where every child learns with purpose, integrity, and joy.",
    blocks: [
      {
        type: "heading",
        text: "A home for curious minds",
        level: 1,
      },
      {
        type: "paragraph",
        html: "At <strong>DEBTEB Montessori School</strong>, we blend child-led learning with strong values. Our classrooms are calm, practical, and full of discovery — so every learner builds confidence and character.",
      },
      {
        type: "callout",
        text: "Education with Godliness — integrity, kindness, and excellence in every lesson.",
        tone: "success",
      },
      {
        type: "heading",
        text: "What families love about DMS",
        level: 2,
      },
      {
        type: "list",
        ordered: false,
        items: [
          "Prepared Montessori environments from early years upward",
          "Teachers who know each child’s pace and strengths",
          "Faith, discipline, and academic care in balance",
          "Safe campus and open partnership with parents",
        ],
      },
      {
        type: "button",
        label: "Start an admissions enquiry",
        href: "/admissions?school=dms",
      },
    ],
  },
  kms: {
    title: "Kayvlop Magnificent School",
    metaTitle: "Kayvlop Magnificent School | Excellence in learning",
    metaDescription:
      "Quality education with strong values — primary through senior secondary at Kayvlop Magnificent School.",
    blocks: [
      {
        type: "heading",
        text: "Excellence. Character. Tomorrow.",
        level: 1,
      },
      {
        type: "paragraph",
        html: "<strong>Kayvlop Magnificent School</strong> is committed to rigorous academics and godly character. From early years to senior secondary, we prepare learners who lead with integrity.",
      },
      {
        type: "quote",
        text: "Nurturing minds. Building character. Shaping tomorrow.",
        cite: "KMS",
      },
      {
        type: "heading",
        text: "Our promise",
        level: 2,
      },
      {
        type: "list",
        ordered: false,
        items: [
          "Strong academic programmes across all levels",
          "Experienced teachers and clear standards",
          "Modern facilities in a safe environment",
          "Close school–home partnership",
        ],
      },
      {
        type: "button",
        label: "Admissions enquiry",
        href: "/admissions?school=kms",
      },
    ],
  },
  test: {
    title: "Test School — Demo campus",
    metaTitle: "Test School | Demo tenant",
    metaDescription: "Demo public site for the Seyi Code multi-tenant school platform.",
    blocks: [
      {
        type: "heading",
        text: "Welcome to the demo campus",
        level: 1,
      },
      {
        type: "paragraph",
        html: "This is the <strong>Test</strong> tenant — used to verify isolation, branding, and public pages. Content here is safe to edit and republish.",
      },
      {
        type: "callout",
        text: "Tip: Change colours, upload media, and publish a home page without touching KMS or DMS.",
        tone: "info",
      },
      {
        type: "button",
        label: "Try admissions form",
        href: "/admissions?school=test",
      },
    ],
  },
};
