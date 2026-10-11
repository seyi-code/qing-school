import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { PortalShell } from "@/components/PortalShell";
import { homeRouteForRole } from "@/lib/permissions";
import { resolveSchoolId, schoolWhere } from "@/lib/tenant-scope";
import { redirect } from "next/navigation";
import { CmsEditor } from "./CmsEditor";

export const dynamic = "force-dynamic";

export default async function CmsPage() {
  const session = await requireSession();
  if (!["ADMIN", "IT", "SECRETARY", "PLATFORM_ADMIN"].includes(session.role)) {
    redirect(homeRouteForRole(session.role));
  }

  const schoolId = await resolveSchoolId(session);
  const sw = schoolWhere(schoolId);

  const [pages, themeRow, media] = await Promise.all([
    prisma.cmsPage.findMany({ where: sw, orderBy: { updatedAt: "desc" } }),
    prisma.siteTheme.findFirst(),
    prisma.mediaAsset.findMany({
      where: schoolId ? { schoolId } : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  const theme = themeRow
    ? JSON.parse(themeRow.configJson)
    : { primary: "#1a2744", accent: "#c9a227", font: "serif" };

  return (
    <PortalShell
      role={session.role}
      title="Website CMS"
      subtitle="Pages, media, SEO for this school"
      email={session.email}
    >
      <CmsEditor
        theme={theme}
        media={media.map((m) => ({ id: m.id, url: m.url, filename: m.filename }))}
        pages={pages.map((p) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          body: p.body,
          published: p.published,
          metaTitle: p.metaTitle,
          metaDescription: p.metaDescription,
          publishAt: p.publishAt?.toISOString() ?? null,
        }))}
      />
    </PortalShell>
  );
}
