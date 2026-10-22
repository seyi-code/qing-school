import { prisma } from "@/lib/db";
import { blocksToHtml, parseBlocks } from "@/lib/cms-blocks";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { getBrandingForSchoolId, defaultBranding } from "@/lib/branding";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

function isLive(page: { published: boolean; publishAt: Date | null }) {
  if (!page.published) return false;
  if (page.publishAt && page.publishAt.getTime() > Date.now()) return false;
  return true;
}

async function resolvePage(slug: string, schoolParam?: string | null) {
  if (schoolParam) {
    const school = await prisma.school.findFirst({
      where: {
        isActive: true,
        OR: [
          { slug: schoolParam.toLowerCase() },
          { shortName: { equals: schoolParam, mode: "insensitive" } },
        ],
      },
      select: { id: true, slug: true, shortName: true, name: true },
    });
    if (school) {
      const page = await prisma.cmsPage.findFirst({
        where: { slug, schoolId: school.id },
      });
      if (page && isLive(page)) return { page, school };
    }
  }

  // Fallback: unique live page for this slug (prefer non-null schoolId)
  const page = await prisma.cmsPage.findFirst({
    where: { slug, published: true, schoolId: { not: null } },
    orderBy: { updatedAt: "desc" },
  });
  if (!page || !isLive(page)) return null;

  const school = page.schoolId
    ? await prisma.school.findUnique({
        where: { id: page.schoolId },
        select: { id: true, slug: true, shortName: true, name: true },
      })
    : null;
  return { page, school };
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { school?: string };
}): Promise<Metadata> {
  const resolved = await resolvePage(params.slug, searchParams?.school);
  if (!resolved) return { title: "Not found" };
  const { page, school } = resolved;
  const title =
    page.metaTitle ||
    (school ? `${page.title} | ${school.shortName}` : page.title);
  return {
    title,
    description: page.metaDescription || undefined,
  };
}

export default async function PublicCmsPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { school?: string };
}) {
  if (params.slug === "home") {
    const s = searchParams?.school;
    redirect(s ? `/site/${encodeURIComponent(s)}` : "/");
  }

  const resolved = await resolvePage(params.slug, searchParams?.school);
  if (!resolved) notFound();

  const { page, school } = resolved;

  // Canonical school-scoped URL when school is known but query missing
  if (school && !searchParams?.school) {
    redirect(`/p/${params.slug}?school=${encodeURIComponent(school.slug)}`);
  }

  const brand = school
    ? await getBrandingForSchoolId(school.id)
    : defaultBranding();
  const homeHref = school ? `/site/${school.slug}` : "/";
  const schoolSlug = school?.slug ?? null;

  return (
    <main className="min-h-screen bg-[#f7f5ef] dark:bg-[#0b1522] text-ink dark:text-[#e8eef5] flex flex-col">
      <MarketingNav brand={brand} schoolSlug={schoolSlug} />
      <article className="max-w-2xl mx-auto px-4 py-10 flex-1 w-full">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9a7820] mb-2">
          {brand.shortName}
        </p>
        <h1 className="font-serif text-3xl text-[#12345a] dark:text-[#e8eef5] mb-6">{page.title}</h1>
        <div
          className="cms-prose text-[15px] leading-relaxed space-y-4 text-[#1e2e43]/90 dark:text-[#c5d0dc]
            [&_h1]:font-serif [&_h1]:text-2xl [&_h1]:text-[#12345a] [&_h1]:dark:text-[#e8eef5] [&_h1]:mt-6
            [&_h2]:font-serif [&_h2]:text-xl [&_h2]:text-[#12345a] [&_h2]:dark:text-[#e8eef5] [&_h2]:mt-5
            [&_h3]:font-semibold [&_h3]:text-lg [&_h3]:mt-4
            [&_p]:mb-3
            [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5
            [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5
            [&_a]:text-[#12345a] [&_a]:font-semibold [&_a]:underline
            [&_blockquote]:border-l-4 [&_blockquote]:border-[#d2ae3b] [&_blockquote]:pl-4 [&_blockquote]:italic
            [&_.cms-callout]:rounded-xl [&_.cms-callout]:px-4 [&_.cms-callout]:py-3 [&_.cms-callout]:my-4
            [&_button]:inline-flex [&_a.cms-btn]:inline-flex [&_a.cms-btn]:items-center [&_a.cms-btn]:px-4 [&_a.cms-btn]:py-2.5
            [&_a.cms-btn]:rounded-lg [&_a.cms-btn]:bg-[#12345a] [&_a.cms-btn]:text-white [&_a.cms-btn]:no-underline [&_a.cms-btn]:font-bold"
          dangerouslySetInnerHTML={{ __html: blocksToHtml(parseBlocks(page.body)) }}
        />
        <p className="mt-10 text-sm">
          <Link href={homeHref} className="text-[#12345a] dark:text-[#f1d264] font-semibold underline">
            ← {brand.shortName} home
          </Link>
        </p>
      </article>
      <MarketingFooter brand={brand} schoolSlug={schoolSlug} />
    </main>
  );
}
