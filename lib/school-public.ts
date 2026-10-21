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
  const schoolSlug = school?.slug ?? null;
  const branding = schoolId
    ? await getBrandingForSchoolId(schoolId)
    : defaultBranding();

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
