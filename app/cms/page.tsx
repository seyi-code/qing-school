import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { PortalShell } from "@/components/PortalShell";
import { homeRouteForRole } from "@/lib/permissions";
import { resolveSchoolId, schoolWhere } from "@/lib/tenant-scope";
import { redirect } from "next/navigation";
import { CmsEditor } from "./CmsEditor";
import { Kpi } from "@/components/ui/Kpi";
import { InstallCmsPackButton } from "@/components/InstallCmsPackButton";

export const dynamic = "force-dynamic";

const DEFAULT_THEME = { primary: "#1a2744", accent: "#c9a227", font: "serif" };

function safeTheme(raw: string | null | undefined) {
  if (!raw || !raw.trim()) return DEFAULT_THEME;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return { ...DEFAULT_THEME, ...parsed };
  } catch {
    /* ignore */
  }
  return DEFAULT_THEME;
}

export default async function CmsPage() {
  const session = await requireSession();
  if (!["ADMIN", "IT", "SECRETARY", "PLATFORM_ADMIN"].includes(session.role)) {
    redirect(homeRouteForRole(session.role));
  }

  const schoolId = await resolveSchoolId(session);
  const sw = schoolWhere(schoolId);

  let pages: Awaited<ReturnType<typeof prisma.cmsPage.findMany>> = [];
  let media: Awaited<ReturnType<typeof prisma.mediaAsset.findMany>> = [];
  let theme = DEFAULT_THEME;
  let schoolSlug: string | null = null;
  let schoolName: string | null = null;

  try {
    const [pageRows, themeRow, mediaRows, school] = await Promise.all([
      prisma.cmsPage.findMany({ where: sw, orderBy: { updatedAt: "desc" } }),
      prisma.siteTheme.findFirst(),
      schoolId
        ? prisma.mediaAsset.findMany({
            where: { OR: [{ schoolId }, { schoolId: null }] },
            orderBy: { createdAt: "desc" },
            take: 100,
          })
        : prisma.mediaAsset.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      schoolId
        ? prisma.school.findUnique({
            where: { id: schoolId },
            select: { slug: true, name: true },
          })
        : Promise.resolve(null),
    ]);
    pages = pageRows;
    media = mediaRows;
    theme = safeTheme(themeRow?.configJson);
    schoolSlug = school?.slug ?? null;
    schoolName = school?.name ?? null;
  } catch (err) {
    console.error("[cms] load failed", err);
  }

  const homePage = pages.find((p) => p.slug === "home") ?? null;

  return (
    <PortalShell
      role={session.role}
      title="Website CMS"
      subtitle={
        schoolName
          ? `Pages & public homepage for ${schoolName}`
          : 'Pages, media, SEO — use slug "home" for the public homepage'
      }
      email={session.email}
    >
      <InstallCmsPackButton schoolName={schoolName} pageCount={pages.length} />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
        <Kpi label="Pages" value={String(pages.length)} tone="navy" icon="📄" />
        <Kpi
          label="Published"
          value={String(pages.filter((p) => p.published).length)}
          tone="sage"
          icon="✓"
        />
        <Kpi
          label="Public home"
          value={homePage ? (homePage.published ? "Live" : "Draft") : "None"}
          tone="gold"
          icon="🏠"
          className="col-span-2 sm:col-span-1"
        />
      </div>
      <CmsEditor
        theme={theme}
        schoolSlug={schoolSlug}
        schoolName={schoolName}
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
