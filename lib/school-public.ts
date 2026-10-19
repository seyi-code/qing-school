/**
 * Public school site resolution (Phase 1b–4).
 * Isolates CMS + notices + branding by schoolId.
 * Root host (no slug/custom domain) defaults to KMS so other tenants never leak onto the platform homepage.
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

/** Resolve School by slug or verified custom domain (host). */
export async function findSchoolForPublic(opts: {
  slug?: string | null;
  host?: string | null;
}) {
  const slug = (opts.slug || "").trim().toLowerCase();
  if (slug) {
    const bySlug = await prisma.school.findFirst({
      where: { slug, isActive: true },
    });
    if (bySlug) return bySlug;
  }

  const host = normalizeHost(opts.host);
  if (!host) return null;

  // customDomain requires schema fields (Phase 4). Guard so missing columns don't crash.
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

export async function loadPublicHome(opts: {
  slug?: string | null;
  host?: string | null;
}): Promise<PublicHomeData> {
  let school = await findSchoolForPublic(opts).catch((err) => {
    console.error("[findSchoolForPublic]", err);
    return null;
  });

  // Platform root (no tenant slug / verified domain) → default to KMS only.
  // Never load another tenant's CMS or notices onto the shared homepage.
  if (!school && !(opts.slug || "").trim()) {
    school = await prisma.school
      .findFirst({ where: { slug: "kms", isActive: true } })
      .catch(() => null);
  }

  const schoolId = school?.id ?? null;
  const branding = schoolId
    ? await getBrandingForSchoolId(schoolId)
    : defaultBranding();

  let notices: PublicHomeData["notices"] = [];
  let cmsHtml: string | null = null;
  let cmsTitle: string | null = null;

  try {
    if (schoolId) {
      const [n, home] = await Promise.all([
        prisma.notice.findMany({
          where: { publishToWeb: true, schoolId },
          orderBy: { createdAt: "desc" },
          take: 4,
        }),
        prisma.cmsPage.findFirst({ where: { slug: "home", schoolId } }),
      ]);
      notices = n;
      if (home && isLive(home) && home.schoolId === schoolId) {
        cmsTitle = home.title;
        cmsHtml = blocksToHtml(parseBlocks(home.body));
      }
    }
    // No schoolId → no CMS/notices (avoid cross-tenant leak)
  } catch (err) {
    console.error("[loadPublicHome]", err);
  }

  return {
    branding,
    schoolId,
    schoolSlug: school?.slug ?? null,
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
