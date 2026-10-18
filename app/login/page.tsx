import { loadPublicHome } from "@/lib/school-public";
import { LoginClient } from "./LoginClient";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?:
    | { school?: string; next?: string; reset?: string }
    | Promise<{ school?: string; next?: string; reset?: string }>;
}) {
  const sp = (await Promise.resolve(searchParams)) || {};
  const slug = typeof sp.school === "string" ? sp.school : null;
  const data = await loadPublicHome({ slug });
  return (
    <LoginClient branding={data.branding} schoolSlug={data.schoolSlug || slug} />
  );
}
