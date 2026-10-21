import { notFound } from "next/navigation";
import { loadPublicHome } from "@/lib/school-public";
import { SchoolPublicHome } from "@/components/marketing/SchoolPublicHome";

export const dynamic = "force-dynamic";

/**
 * Phase 1b preview without DNS:
 * /site/kms  → Kayvlop home
 * /site/dms  → Debteb Montessori (slug or shortName DMS)
 * /site/test → Test School home
 */
export default async function SchoolSitePreviewPage({
  params,
}: {
  params: { slug: string };
}) {
  const slug = (params.slug || "").toLowerCase().trim();
  if (!slug || slug === "www" || slug === "app" || slug === "api") notFound();

  const data = await loadPublicHome({ slug, requireSlug: true });
  if (!data.schoolId) notFound();

  // Allow URL slug to match DB slug OR shortName (case-insensitive).
  const dbSlug = (data.schoolSlug || "").toLowerCase();
  const short = (data.branding.shortName || "").toLowerCase();
  const matches = dbSlug === slug || short === slug;

  if (!matches) notFound();

  // Use the path slug so nav links stay on /site/dms (not a long DB slug)
  return (
    <SchoolPublicHome
      branding={data.branding}
      notices={data.notices}
      cmsHtml={data.cmsHtml}
      cmsTitle={data.cmsTitle}
      isTenantSite
      schoolSlug={slug}
    />
  );
}
