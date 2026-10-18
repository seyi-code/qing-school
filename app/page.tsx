import { loadPublicHomeFromHeaders } from "@/lib/school-public";
import { SchoolPublicHome } from "@/components/marketing/SchoolPublicHome";

export const dynamic = "force-dynamic";

/**
 * Public root homepage.
 * - Legacy / vercel hosts (no tenant header): default KMS-style branding.
 * - Subdomain / verified custom domain (middleware sets x-school-slug or host match): that school.
 */
export default async function PublicHomePage() {
  const data = await loadPublicHomeFromHeaders();
  return (
    <SchoolPublicHome
      branding={data.branding}
      notices={data.notices}
      cmsHtml={data.cmsHtml}
      cmsTitle={data.cmsTitle}
      isTenantSite={data.isTenantSite}
      schoolSlug={data.schoolSlug}
    />
  );
}
