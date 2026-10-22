/**
 * Default CMS content packs per school.
 * Body is JSON block arrays compatible with lib/cms-blocks.ts.
 * Install is school-scoped and never overwrites existing pages unless force=true.
 */

import { newId, type Block } from "@/lib/cms-blocks";

export type CmsPackPage = {
  slug: string;
  title: string;
  published: boolean;
  metaTitle?: string;
  metaDescription?: string;
  blocks: Block[];
};

function bid(): string {
  return newId();
}

function packForSchool(input: {
  name: string;
  shortName: string;
  slug: string;
  motto?: string | null;
}): CmsPackPage[] {
  const name = input.name || "Our School";
  const short = (input.shortName || input.slug || "SCH").toUpperCase();
  const slug = (input.slug || "school").toLowerCase();
  const motto = input.motto || "Excellence in learning";
  const siteBase = `/site/${slug}`;
  const admitHref = `/admissions?school=${encodeURIComponent(slug)}`;
  const contactHref = `/contact?school=${encodeURIComponent(slug)}`;

  const home: CmsPackPage = {
    slug: "home",
    title: `${name} — Home`,
    published: true,
    metaTitle: `${name} | ${motto}`,
    metaDescription: `${name} provides quality education with character and purpose.`,
    blocks: [
      {
        id: bid(),
        type: "heading",
        level: 1,
        text: `Welcome to ${name}`,
      },
      {
        id: bid(),
        type: "paragraph",
        html: `<p>At <strong>${name}</strong> (${short}), we nurture every learner with strong academics, character, and faith. Our community in partnership with parents prepares children to lead with integrity.</p>`,
      },
      {
        id: bid(),
        type: "callout",
        tone: "info",
        text: motto,
      },
      {
        id: bid(),
        type: "heading",
        level: 2,
        text: "What we offer",
      },
      {
        id: bid(),
        type: "list",
        ordered: false,
        items: [
          "Solid academic foundation from early years through secondary",
          "Character formation and godly values",
          "Safe, caring environment for every child",
          "Partnership with parents and the wider community",
        ],
      },
      {
        id: bid(),
        type: "button",
        label: "Start an admissions enquiry",
        href: admitHref,
      },
      {
        id: bid(),
        type: "button",
        label: "Contact us",
        href: contactHref,
      },
    ],
  };

  const about: CmsPackPage = {
    slug: "about",
    title: `About ${name}`,
    published: true,
    metaTitle: `About ${name}`,
    metaDescription: `Learn about ${name}, our mission, and what makes us unique.`,
    blocks: [
      { id: bid(), type: "heading", level: 1, text: `About ${name}` },
      {
        id: bid(),
        type: "paragraph",
        html: `<p>${name} is committed to excellent education that equips students with knowledge, skills, and values to serve their communities.</p>`,
      },
      {
        id: bid(),
        type: "quote",
        text: motto,
        cite: short,
      },
      {
        id: bid(),
        type: "heading",
        level: 2,
        text: "Our promise",
      },
      {
        id: bid(),
        type: "paragraph",
        html: `<p>We combine high academic standards with a caring heart. Teachers, staff, and families work together so every child can grow in confidence and purpose.</p>`,
      },
      {
        id: bid(),
        type: "button",
        label: "Back to homepage",
        href: siteBase,
      },
    ],
  };

  const admissions: CmsPackPage = {
    slug: "admissions",
    title: `Admissions — ${name}`,
    published: true,
    metaTitle: `Admissions | ${name}`,
    metaDescription: `How to apply to ${name}. Start an enquiry online.`,
    blocks: [
      { id: bid(), type: "heading", level: 1, text: "Admissions" },
      {
        id: bid(),
        type: "paragraph",
        html: `<p>Thank you for considering <strong>${name}</strong>. We welcome families who value strong academics and character.</p>`,
      },
      {
        id: bid(),
        type: "heading",
        level: 2,
        text: "How to apply",
      },
      {
        id: bid(),
        type: "list",
        ordered: true,
        items: [
          "Submit an admissions enquiry online",
          "Visit the school for an assessment or interview when invited",
          "Complete registration and fee formalities",
          "Receive your admission number and welcome pack",
        ],
      },
      {
        id: bid(),
        type: "callout",
        tone: "success",
        text: "Ready to begin? Use the enquiry form — our team will respond promptly.",
      },
      {
        id: bid(),
        type: "button",
        label: "Open admissions enquiry form",
        href: admitHref,
      },
    ],
  };

  const contact: CmsPackPage = {
    slug: "contact",
    title: `Contact ${name}`,
    published: true,
    metaTitle: `Contact | ${name}`,
    metaDescription: `Get in touch with ${name}.`,
    blocks: [
      { id: bid(), type: "heading", level: 1, text: "Contact us" },
      {
        id: bid(),
        type: "paragraph",
        html: `<p>We would love to hear from you. Reach ${short} by phone, email, or the contact form on this site.</p>`,
      },
      {
        id: bid(),
        type: "button",
        label: "Go to contact form",
        href: contactHref,
      },
      {
        id: bid(),
        type: "button",
        label: "School homepage",
        href: siteBase,
      },
    ],
  };

  return [home, about, admissions, contact];
}

/** Build pack pages for a school record. */
export function buildCmsPackForSchool(school: {
  name: string;
  shortName: string;
  slug: string;
  motto?: string | null;
}): CmsPackPage[] {
  return packForSchool(school);
}

export function blocksToBody(blocks: Block[]): string {
  return JSON.stringify(blocks);
}
