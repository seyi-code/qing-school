/**
 * Per-school public design presets + marketing copy.
 * Classic copy aligned with polished KMS marketing homepage.
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
  about: {
    eyebrow: string;
    title: string;
    titleAccent: string;
    body: string;
    mottoLine: string;
  };
  programmesIntro: { title: string; body: string };
  programmes: Array<{ title: string; body: string }>;
  why: {
    eyebrow: string;
    title: string;
    body: string;
    items: Array<{ title: string; body: string; icon: string }>;
  };
  promise: { title: string; titleAccent: string; body: string };
  highlights: Array<{ icon: string; title: string; body: string }>;
  values: Array<{ label: string; icon: string }>;
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
      line1: "Growing minds.",
      line2: "Building character.",
      line3: "Shaping tomorrow.",
      blurb:
        "we provide a nurturing and inspiring environment where every child learns, builds integrity, grows in faith and discovers their purpose.",
      ctaExplore: "Explore Our School →",
      ctaAdmit: "Admissions Enquiry →",
    },
    about: {
      eyebrow: "About us",
      title: "More than education.",
      titleAccent: "A foundation for life.",
      body: "is committed to providing excellent education that equips students with the knowledge, skills and values to make a positive impact in their communities and the world.",
      mottoLine:
        "Our motto guides how we learn, how we treat one another and how we prepare children for the future.",
    },
    programmesIntro: {
      title: "Holistic education for every learner.",
      body: "We aim to provide a balanced learning experience combining academic growth with character formation, creativity and practical skills.",
    },
    programmes: [
      { title: "Early Years", body: "A strong foundation for lifelong learning." },
      { title: "Primary School", body: "Building confidence and curiosity." },
      { title: "Junior Secondary", body: "Developing skills for a brighter future." },
      { title: "Senior Secondary", body: "Preparing leaders and innovators." },
    ],
    why: {
      eyebrow: "Why us",
      title: "High standards. A caring heart.",
      body: "We work to create a supportive, disciplined and modern learning environment where every child is valued, encouraged and empowered to achieve their best.",
      items: [
        {
          title: "Experienced Educators",
          body: "Patient, committed and caring guidance for learners.",
          icon: "💛",
        },
        {
          title: "Safe Environment",
          body: "A secure, respectful and encouraging atmosphere.",
          icon: "🏫",
        },
        {
          title: "Parent Partnership",
          body: "Working with families to support every child's growth.",
          icon: "✨",
        },
      ],
    },
    promise: {
      title: "Learning for life.",
      titleAccent: "Character for living.",
      body: "Success is not only what a child knows. It is also the confidence, kindness, discipline and responsibility they carry into the world.",
    },
    highlights: [
      { icon: "📚", title: "Academic Excellence", body: "Quality education for a brighter future" },
      { icon: "🛡️", title: "Strong Values", body: "Integrity, discipline and godliness" },
      { icon: "👥", title: "Supportive Community", body: "Partnership between school and home" },
      { icon: "💻", title: "Modern Facilities", body: "A safe and conducive learning environment" },
    ],
    values: [
      { label: "Academic Excellence", icon: "✨" },
      { label: "Moral Integrity", icon: "💛" },
      { label: "Faith", icon: "✝️" },
      { label: "Leadership", icon: "👥" },
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
        "a calm Montessori home for learning — where children explore at their own pace, rooted in values and Education with Godliness.",
      ctaExplore: "Discover our school →",
      ctaAdmit: "Start application →",
    },
    about: {
      eyebrow: "About us",
      title: "Prepared for life.",
      titleAccent: "Rooted in care.",
      body: "blends child-led learning with strong values. Classrooms are calm, practical, and full of discovery so every learner builds confidence and character.",
      mottoLine: "Education with Godliness — integrity, kindness, and excellence in every lesson.",
    },
    programmesIntro: {
      title: "Learning that follows the child.",
      body: "From toddler through upper primary, environments invite independence, focus, and joy.",
    },
    programmes: [
      { title: "Toddler & Early Years", body: "Prepared environments that invite discovery." },
      { title: "Primary", body: "Independence, focus, and joy in learning." },
      { title: "Upper Primary", body: "Responsibility, collaboration, and deeper study." },
      { title: "Beyond the classroom", body: "Character, faith, and practical life skills." },
    ],
    why: {
      eyebrow: "Why families choose us",
      title: "A second home for growing minds.",
      body: "Guides who observe carefully, spaces that invite focus, and a partnership with every family.",
      items: [
        {
          title: "Montessori trained guides",
          body: "Teachers who observe and support each learner.",
          icon: "💛",
        },
        {
          title: "Whole-child care",
          body: "Mind, heart, and practical life in balance.",
          icon: "🌿",
        },
        {
          title: "Warm community",
          body: "A school that feels like a second home.",
          icon: "🏠",
        },
      ],
    },
    promise: {
      title: "Independence.",
      titleAccent: "Integrity. Joy.",
      body: "We prepare children who can think for themselves, care for others, and walk in purpose.",
    },
    highlights: [
      { icon: "🌱", title: "Child-led learning", body: "Pace and curiosity respected every day" },
      { icon: "🙏", title: "Godliness", body: "Faith and character at the centre" },
      { icon: "🤝", title: "Family partnership", body: "Parents and teachers grow together" },
      { icon: "🏡", title: "Prepared spaces", body: "Calm classrooms built for focus" },
    ],
    values: [
      { label: "Curiosity", icon: "🌱" },
      { label: "Respect", icon: "🤝" },
      { label: "Faith", icon: "✝️" },
      { label: "Independence", icon: "✨" },
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
        "a demo campus for the multi-tenant platform — fresh branding, isolated data, and a public site you can customise freely.",
      ctaExplore: "See the campus →",
      ctaAdmit: "Try admissions →",
    },
    about: {
      eyebrow: "Demo tenant",
      title: "Safe to experiment.",
      titleAccent: "Built for isolation.",
      body: "is the Test school workspace — use it to verify branding, CMS, and admissions without touching live campuses.",
      mottoLine: "Change colours, upload media, publish pages — production schools stay untouched.",
    },
    programmesIntro: {
      title: "Sample programme cards.",
      body: "Same layout as live schools; swap copy and photos when you are ready.",
    },
    programmes: [
      { title: "Foundation", body: "Skills for a digital-first world." },
      { title: "Core Academy", body: "Clear standards and creative projects." },
      { title: "Explorer Track", body: "STEM, arts, and collaboration." },
      { title: "Leadership Lab", body: "Communication and service learning." },
    ],
    why: {
      eyebrow: "Why this demo",
      title: "One codebase. Many brands.",
      body: "Prove tenant isolation, themes, and public pages before you onboard the next school.",
      items: [
        {
          title: "Built for multi-tenant",
          body: "One codebase, many school brands.",
          icon: "🧩",
        },
        {
          title: "Safe to experiment",
          body: "Edit Test without touching live schools.",
          icon: "🧪",
        },
        {
          title: "Production path",
          body: "Same stack you promote to real campuses.",
          icon: "✅",
        },
      ],
    },
    promise: {
      title: "Ship faster.",
      titleAccent: "Stay isolated.",
      body: "Platform admins onboard schools; each tenant gets its own public face and data boundary.",
    },
    highlights: [
      { icon: "⚡", title: "Fast isolation demo", body: "Tenant-safe public + portal surfaces" },
      { icon: "🎨", title: "Brand flexible", body: "Colours, copy, and media per school" },
      { icon: "🔒", title: "Secure by default", body: "No cross-school data leakage" },
      { icon: "🚀", title: "Ready to customise", body: "CMS, themes, and domains" },
    ],
    values: [
      { label: "Isolation", icon: "🔒" },
      { label: "Speed", icon: "⚡" },
      { label: "Clarity", icon: "✨" },
      { label: "Scale", icon: "📈" },
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
