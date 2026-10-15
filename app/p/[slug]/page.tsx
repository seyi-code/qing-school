import { prisma } from "@/lib/db";
import { blocksToHtml, parseBlocks } from "@/lib/cms-blocks";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SCHOOL } from "@/lib/school-config";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

function isLive(page: { published: boolean; publishAt: Date | null }) {
  if (!page.published) return false;
  if (page.publishAt && page.publishAt.getTime() > Date.now()) return false;
  return true;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const page = await prisma.cmsPage.findFirst({ where: { slug: params.slug } });
  if (!page || !isLive(page)) return { title: "Not found" };
  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || undefined,
  };
}

export default async function PublicCmsPage({ params }: { params: { slug: string } }) {
  if (params.slug === "home") {
    const { redirect } = await import("next/navigation");
    redirect("/");
  }

  const [page, themeRow] = await Promise.all([
    prisma.cmsPage.findFirst({ where: { slug: params.slug } }),
    prisma.siteTheme.findFirst(),
  ]);
  if (!page || !isLive(page)) notFound();

  const theme = themeRow
    ? JSON.parse(themeRow.configJson)
    : { primary: "#1a2744", accent: "#c9a227", font: "serif" };

  return (
    <main
      className="min-h-screen bg-[#f7f5ef] text-ink flex flex-col"
      style={{
        fontFamily: theme.font === "sans" ? "system-ui, sans-serif" : "Georgia, serif",
        // @ts-expect-error css vars
        "--cms-primary": theme.primary,
        "--cms-accent": theme.accent,
      }}
    >
      <MarketingNav />
      <article className="max-w-2xl mx-auto px-4 py-10 flex-1 w-full">
        <h1 className="font-serif text-3xl text-[#12345a] mb-6">{page.title}</h1>
        <div
          className="prose text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: blocksToHtml(parseBlocks(page.body)) }}
        />
        <p className="mt-10 text-sm">
          <Link href="/" className="text-[#12345a] font-semibold underline">
            ← {SCHOOL.shortName} home
          </Link>
        </p>
      </article>
      <MarketingFooter />
    </main>
  );
}
