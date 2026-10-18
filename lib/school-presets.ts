/**
 * Per-school public design presets + marketing copy.
 */

export type LayoutPresetId = "classic" | "montessori" | "modern";

export type SchoolPreset = {
  id: LayoutPresetId;
  label: string;
  primary: string;
  accent: string;
  font: "serif" | "sans";
  tone: "formal" | "warm" | "fresh";
  hero: {
    line1: string;
    line2: string;
    line3: string;
    blurb: string;
    ctaExplore: string;
    ctaAdmit: string;
  };
  programmes: Array<{ title: string; body: string }>;
  highlights: Array<{ icon: string; title: string; body: string }>;
  why: Array<{ title: string; body: string; icon: string }>;
};

export const PRESETS: Record<LayoutPresetId, SchoolPreset> = {
  classic: {
    id: "classic",
    label: "Classic formal",
    primary: "#12345a",
    accent: "#d2ae3b",
    font: "serif",
    tone: "formal",
    hero: {
      line1: "Nurturing minds.",
      line2: "Building character.",
      line3: "Shaping tomorrow.",
      blurb:
        "We provide a rigorous and inspiring environment where every child learns, builds integrity, and discovers their purpose.",
      ctaExplore: "Explore Our School →",
      ctaAdmit: "Admissions Enquiry",
    },
    programmes: [
      { title: "Early Years", body: "A strong foundation for lifelong success." },
      { title: "Primary School", body: "Building confidence and curiosity." },
      { title: "Junior Secondary", body: "Developing skills for a brighter future." },
      { title: "Senior Secondary", body: "Preparing leaders and innovators." },
    ],
    highlights: [
      { icon: "📚", title: "Academic Excellence", body: "Quality education for a brighter future" },
      { icon: "🛡️", title: "Strong Values", body: "Integrity, discipline and godliness" },
      { icon: "👥", title: "Supportive Community", body: "Partnership between school and home" },
      { icon: "💻", title: "Modern Facilities", body: "A safe and conducive learning environment" },
    ],
    why: [
      { title: "Experienced Teachers", body: "Passionate, qualified staff who know every child.", icon: "💛" },
      { title: "Safe Environment", body: "A secure and conducive learning atmosphere.", icon: "🏫" },
      { title: "Modern Facilities", body: "Well-equipped library, labs and more.", icon: "✨" },
    ],
  },
  montessori: {
    id: "montessori",
    label: "Montessori warm",
    primary: "#5c3d2e",
    accent: "#c4783a",
    font: "serif",
    tone: "warm",
    hero: {
      line1: "Curious minds.",
      line2: "Gentle guidance.",
      line3: "Growing in purpose.",
      blurb:
        "A calm Montessori home for learning — where children explore at their own pace, rooted in values and Education with Godliness.",
      ctaExplore: "Discover DMS →",
      ctaAdmit: "Start application",
    },
    programmes: [
      { title: "Toddler & Early Years", body: "Prepared environments that invite discovery." },
      { title: "Primary", body: "Independence, focus, and joy in learning." },
      { title: "Upper Primary", body: "Responsibility, collaboration, and deeper study." },
      { title: "Beyond the classroom", body: "Character, faith, and practical life skills." },
    ],
    highlights: [
      { icon: "🌱", title: "Child-led learning", body: "Pace and curiosity respected every day" },
      { icon: "🙏", title: "Godliness", body: "Faith and character at the centre" },
      { icon: "🤝", title: "Family partnership", body: "Parents and teachers grow together" },
      { icon: "🏡", title: "Prepared spaces", body: "Calm classrooms built for focus" },
    ],
    why: [
      { title: "Montessori trained guides", body: "Teachers who observe and support each learner.", icon: "💛" },
      { title: "Whole-child care", body: "Mind, heart, and practical life in balance.", icon: "🌿" },
      { title: "Warm community", body: "A school that feels like a second home.", icon: "🏠" },
    ],
  },
  modern: {
    id: "modern",
    label: "Modern fresh",
    primary: "#0f3d3e",
    accent: "#2dd4bf",
    font: "sans",
    tone: "fresh",
    hero: {
      line1: "Learn boldly.",
      line2: "Think clearly.",
      line3: "Lead kindly.",
      blurb:
        "A demo campus for the Seyi Code platform — fresh branding, isolated data, and a public site you can customise freely.",
      ctaExplore: "See the campus →",
      ctaAdmit: "Try admissions",
    },
    programmes: [
      { title: "Foundation", body: "Skills for a digital-first world." },
      { title: "Core Academy", body: "Clear standards and creative projects." },
      { title: "Explorer Track", body: "STEM, arts, and collaboration." },
      { title: "Leadership Lab", body: "Communication and service learning." },
    ],
    highlights: [
      { icon: "⚡", title: "Fast isolation demo", body: "Tenant-safe public + portal surfaces" },
      { icon: "🎨", title: "Brand flexible", body: "Colours, copy, and media per school" },
      { icon: "🔒", title: "Secure by default", body: "No cross-school data leakage" },
      { icon: "🚀", title: "Ready to customise", body: "CMS, themes, and domains" },
    ],
    why: [
      { title: "Built for multi-tenant", body: "One codebase, many school brands.", icon: "🧩" },
      { title: "Safe to experiment", body: "Edit Test without touching live schools.", icon: "🧪" },
      { title: "Production path", body: "Same stack you promote to real campuses.", icon: "✅" },
    ],
  },
};

export const SLUG_PRESET: Record<string, LayoutPresetId> = {
  kms: "classic",
  dms: "montessori",
  test: "modern",
};

export function presetForSlug(slug: string | null | undefined): SchoolPreset {
  const id = (slug && SLUG_PRESET[slug.toLowerCase()]) || "classic";
  return PRESETS[id];
}
