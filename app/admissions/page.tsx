import { loadPublicHome } from "@/lib/school-public";
import { AdmissionsClient } from "./AdmissionsClient";

export const dynamic = "force-dynamic";

/**
 * Public admissions form — scoped by ?school=slug (from /site/[slug] links)
 * or subdomain header. Prevents DMS applicants landing on KMS branding.
 */
export default async function AdmissionsPage({
  searchParams,
}: {
  searchParams?: { school?: string } | Promise<{ school?: string }>;
}) {
  const sp = (await Promise.resolve(searchParams)) || {};
  const slug = typeof sp.school === "string" ? sp.school : null;
  const data = await loadPublicHome({ slug });

  return (
    <AdmissionsClient branding={data.branding} schoolSlug={data.schoolSlug || slug} />
  );
}
