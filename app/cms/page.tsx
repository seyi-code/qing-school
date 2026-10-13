import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { PortalShell } from "@/components/PortalShell";
import { homeRouteForRole } from "@/lib/permissions";
import { resolveSchoolId, schoolWhere } from "@/lib/tenant-scope";
import { redirect } from "next/navigation";
import { CmsEditor } from "./CmsEditor";

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

  try {
    const [pageRows, themeRow, mediaRows] = await Promise.all([
      prisma.cmsPage.findMany({ where: sw, orderBy: { updatedAt: "desc" } }),
      prisma.siteTheme.findFirst(),
      schoolId
        ? prisma.mediaAsset.findMany({
            where: { OR: [{ schoolId }, { schoolId: null }] },
            orderBy: { createdAt: "desc" },
            take: 100,
          })
        : prisma.mediaAsset.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    ]);
    pages = pageRows;
    media = mediaRows;
    theme = safeTheme(themeRow?.configJson);
  } catch (err) {
    console.error("[cms] load failed", err);
  }

  return (
    <PortalShell
      role={session.role}
      title="Website CMS"
      subtitle="Pages, media, SEO for this school"
      email={session.email}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
        <div className="rounded-xl border border-blue-200/90 bg-gradient-to-br from-blue-50 to-white px-3.5 py-3 shadow-sm">
          <p className="text-[10px] uppercase tracking-wide font-medium text-blue-700/70">Pages</p>
          <p className="mt-1 text-xl font-semibold text-blue-900 tabular-nums">{pages.length}</p>
        </div>
        <div className="rounded-xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50 to-white px-3.5 py-3 shadow-sm">
          <p className="text-[10px] uppercase tracking-wide font-medium text-emerald-700/70">Published</p>
          <p className="mt-1 text-xl font-semibold text-emerald-800 tabular-nums">
            {pages.filter((p) => p.published).length}
          </p>
        </div>
        <div className="rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50 to-white px-3.5 py-3 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-[10px] uppercase tracking-wide font-medium text-amber-800/70">Media</p>
          <p className="mt-1 text-xl font-semibold text-amber-900 tabular-nums">{media.length}</p>
        </div>
      </div>
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
