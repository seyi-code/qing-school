import { loadPublicHome } from "@/lib/school-public";
import { ContactClient } from "./ContactClient";

export const dynamic = "force-dynamic";

export default async function ContactPage({
  searchParams,
}: {
  searchParams?: { school?: string } | Promise<{ school?: string }>;
}) {
  const sp = (await Promise.resolve(searchParams)) || {};
  const slug = typeof sp.school === "string" ? sp.school : null;
  const data = await loadPublicHome({ slug });
  return (
    <ContactClient branding={data.branding} schoolSlug={data.schoolSlug || slug} />
  );
}
