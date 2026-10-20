import { notFound } from "next/navigation";
import { loadPublicHome } from "@/lib/school-public";
import { SchoolPublicHome } from "@/components/marketing/SchoolPublicHome";

export const dynamic = "force-dynamic";

/**
 * Phase 1b preview without DNS:
 * /site/kms  → Kayvlop home
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
  if (!data.schoolId || data.schoolSlug !== slug) notFound();

  return (
    <SchoolPublicHome
      branding={data.branding}
      notices={data.notices}
      cmsHtml={data.cmsHtml}
      cmsTitle={data.cmsTitle}
      isTenantSite
      schoolSlug={data.schoolSlug || slug}
    />
  );
}
