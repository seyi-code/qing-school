/**
 * Public school site resolution (Phase 1b–4).
 * Isolates CMS + notices + branding by schoolId.
 * Root host (no real tenant slug) defaults to KMS.
 */
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { getBrandingForSchoolId, defaultBranding, type Branding } from "@/lib/branding";
import { blocksToHtml, parseBlocks } from "@/lib/cms-blocks";
import { normalizeHost } from "@/lib/host-mode";
import { presetForSlug } from "@/lib/school-presets";

export type PublicHomeData = {
  branding: Branding;
  schoolId: string | null;
  schoolSlug: string | null;
  notices: Array<{ id: string; title: string; body: string; createdAt: Date }>;
  cmsHtml: string | null;
  cmsTitle: string | null;
  isTenantSite: boolean;
};

function isLive(page: { published: boolean; publishAt: Date | null }) {
  if (!page.published) return false;
  if (page.publishAt && page.publishAt.getTime() > Date.now()) return false;
  return true;
}

/** True for deployment / noise slugs that are not real schools. */
function isBogusTenantSlug(slug: string): boolean {
  const s = slug.toLowerCase();
  if (!s) return true;
  if (s.includes("qing-school")) return true;
  if (s.includes("vercel")) return true;
  if (s.length > 48) return true;
  return false;
}

/** Known demo / product tenants that must resolve on /site/{slug}. */
const KNOWN_TENANTS: Record<
  string,
  {
    name: string;
    shortName: string;
    motto: string;
    primaryColor: string;
    accentColor: string;
    isDemo: boolean;
  }
> = {
  dms: {
    name: "Debteb Montessori School",
    shortName: "DMS",
    motto: "Education with Godliness",
    primaryColor: "#5c3d2e",
    accentColor: "#c4783a",
    isDemo: false,
  },
  test: {
    name: "Test School",
    shortName: "TEST",
    motto: "Education with Godliness",
    primaryColor: "#0f3d3e",
    accentColor: "#2dd4bf",
    isDemo: true,
  },
};

/**
 * If /site/dms (or /site/test) is requested but the row is missing,
 * create the school so public preview works. Does not overwrite existing rows.
 */
async function ensureKnownTenant(slug: string) {
  const key = slug.toLowerCase();
  const def = KNOWN_TENANTS[key];
  if (!def) return null;

  const existing = await prisma.school.findFirst({
    where: { slug: key },
  });
  if (existing) {
    // Reactivate if someone suspended it
    if (!existing.isActive) {
      return prisma.school.update({
        where: { id: existing.id },
        data: { isActive: true },
      });
    }
    return existing;
  }

  // Also match by shortName in case onboarded under a different slug
  const byShort = await prisma.school.findFirst({
    where: {
      isActive: true,
      OR: [
        { shortName: { equals: def.shortName, mode: "insensitive" } },
        { name: { contains: key === "dms" ? "Debteb" : "Test School", mode: "insensitive" } },
      ],
    },
  });
  if (byShort) {
    // Prefer the real onboarded school; do not force-rename slug (may break domains)
    return byShort;
  }

  return prisma.school.create({
    data: {
      slug: key,
      name: def.name,
      shortName: def.shortName,
      motto: def.motto,
      primaryColor: def.primaryColor,
      accentColor: def.accentColor,
      plan: "STARTER",
      isActive: true,
      isDemo: def.isDemo,
      maxStudents: 500,
    },
  });
}

/** Resolve School by slug or verified custom domain (host). */
export async function findSchoolForPublic(opts: {
  slug?: string | null;
  host?: string | null;
}) {
  const slug = (opts.slug || "").trim().toLowerCase();
  if (slug && !isBogusTenantSlug(slug)) {
    const bySlug = await prisma.school.findFirst({
      where: { slug, isActive: true },
    });
    if (bySlug) return bySlug;

    // Known product tenants (dms / test) — create or recover if missing
    if (KNOWN_TENANTS[slug]) {
      const ensured = await ensureKnownTenant(slug).catch((err) => {
        console.error("[ensureKnownTenant]", err);
        return null;
      });
      if (ensured?.isActive) return ensured;
    }

    // shortName fallback (e.g. URL /site/dms but DB shortName DMS with different slug)
    const byShort = await prisma.school.findFirst({
      where: {
        isActive: true,
        shortName: { equals: slug, mode: "insensitive" },
      },
    });
    if (byShort) return byShort;
  }

  const host = normalizeHost(opts.host);
  if (!host) return null;

  try {
    const byDomain = await prisma.school.findFirst({
      where: {
        isActive: true,
        customDomain: host,
        domainVerifiedAt: { not: null },
      },
    });
    if (byDomain) return byDomain;
  } catch (err) {
    console.warn("[findSchoolForPublic] customDomain lookup skipped:", err);
  }

  return null;
}

async function resolveDefaultKms() {
  return prisma.school
    .findFirst({ where: { slug: "kms", isActive: true } })
    .catch(() => null);
}

/** Homepage fetches a modest batch; UI shows 4 then "Show more". */
const PUBLIC_NEWS_TAKE = 12;

export async function loadPublicHome(opts: {
  slug?: string | null;
  host?: string | null;
  /** When true, missing school stays null (for /site/[slug] 404). */
  requireSlug?: boolean;
}): Promise<PublicHomeData> {
  const requestedSlug = (opts.slug || "").trim().toLowerCase();

  let school = await findSchoolForPublic(opts).catch((err) => {
    console.error("[findSchoolForPublic]", err);
    return null;
  });

  // Root / bogus vercel subdomain → KMS. Explicit /site/{real-slug} keeps null for 404.
  if (!school) {
    const explicitTenant =
      opts.requireSlug && requestedSlug && !isBogusTenantSlug(requestedSlug);
    if (!explicitTenant) {
      school = await resolveDefaultKms();
    }
  }

  const schoolId = school?.id ?? null;
  // Prefer the school's real slug so branding/presets match DB even if URL used shortName alias
  const schoolSlug = school?.slug ?? null;
  const branding = schoolId
    ? await getBrandingForSchoolId(schoolId)
    : defaultBranding();

  // Align preset colours when DB colours empty
  void presetForSlug(schoolSlug);

  let notices: PublicHomeData["notices"] = [];
  let cmsHtml: string | null = null;
  let cmsTitle: string | null = null;

  try {
    if (schoolId) {
      // KMS: tenant notices + legacy null schoolId rows.
      // Other schools: only their schoolId.
      const noticeWhere =
        schoolSlug === "kms"
          ? {
              publishToWeb: true as const,
              OR: [{ schoolId }, { schoolId: null }],
            }
          : { publishToWeb: true as const, schoolId };

      const [n, home] = await Promise.all([
        prisma.notice.findMany({
          where: noticeWhere,
          orderBy: { createdAt: "desc" },
          take: PUBLIC_NEWS_TAKE,
        }),
        prisma.cmsPage.findFirst({ where: { slug: "home", schoolId } }),
      ]);
      notices = n;
      if (home && isLive(home) && home.schoolId === schoolId) {
        cmsTitle = home.title;
        cmsHtml = blocksToHtml(parseBlocks(home.body));
      }
    }
  } catch (err) {
    console.error("[loadPublicHome]", err);
  }

  return {
    branding,
    schoolId,
    schoolSlug,
    notices,
    cmsHtml,
    cmsTitle,
    isTenantSite: Boolean(schoolId),
  };
}

/** From request headers (middleware x-school-slug + host). */
export async function loadPublicHomeFromHeaders(): Promise<PublicHomeData> {
  const h = await headers();
  return loadPublicHome({
    slug: h.get("x-school-slug"),
    host: h.get("host") || h.get("x-forwarded-host"),
  });
}
