import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { resolveSchoolId } from "@/lib/tenant-scope";
import {
  buildCmsPackForSchool,
  blocksToBody,
  mapTemplatePages,
  type CmsPageSnapshot,
} from "@/lib/cms-packs";

const Schema = z.object({
  schoolId: z.string().optional(),
  force: z.boolean().optional(),
  mode: z.enum(["default", "from_template"]).optional(),
  sourceSlug: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || !can(session.role, "MANAGE_CMS")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = Schema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  let schoolId = await resolveSchoolId(session);
  if (parsed.data.schoolId) {
    if (session.role !== "PLATFORM_ADMIN" && session.role !== "IT") {
      return NextResponse.json(
        { error: "Only platform admins can install packs for another school." },
        { status: 403 }
      );
    }
    schoolId = parsed.data.schoolId;
  }

  if (!schoolId) {
    return NextResponse.json(
      { error: "No active school. Use Work as this school, then try again." },
      { status: 400 }
    );
  }

  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) return NextResponse.json({ error: "School not found" }, { status: 404 });

  const force = Boolean(parsed.data.force);
  const mode = parsed.data.mode || "default";
  const created: string[] = [];
  const updated: string[] = [];
  const skipped: string[] = [];

  type PageIn = {
    slug: string;
    title: string;
    body: string;
    published: boolean;
    metaTitle?: string | null;
    metaDescription?: string | null;
  };

  let pages: PageIn[] = [];
  let sourceMeta: { slug: string; name: string } | null = null;

  if (mode === "from_template") {
    const sourceSlug = (parsed.data.sourceSlug || "dms").toLowerCase();
    const source = await prisma.school.findUnique({ where: { slug: sourceSlug } });
    if (!source) {
      return NextResponse.json(
        {
          error: `Template school "${sourceSlug}" not found. Onboard DMS first, or pass sourceSlug.`,
        },
        { status: 404 }
      );
    }
    if (source.id === school.id) {
      return NextResponse.json(
        { error: "Cannot copy template onto the same school." },
        { status: 400 }
      );
    }
    const sourcePages = await prisma.cmsPage.findMany({
      where: { schoolId: source.id },
      orderBy: { slug: "asc" },
    });
    if (!sourcePages.length) {
      return NextResponse.json(
        {
          error: `No CMS pages on ${source.slug}. Install a default pack on that school first.`,
        },
        { status: 400 }
      );
    }
    const snapshots: CmsPageSnapshot[] = sourcePages.map((p) => ({
      slug: p.slug,
      title: p.title,
      body: p.body,
      published: p.published,
      metaTitle: p.metaTitle,
      metaDescription: p.metaDescription,
    }));
    pages = mapTemplatePages(snapshots, source, school);
    sourceMeta = { slug: source.slug, name: source.name };
  } else {
    const pack = buildCmsPackForSchool({
      name: school.name,
      shortName: school.shortName,
      slug: school.slug,
      motto: school.motto,
    });
    pages = pack.map((page) => ({
      slug: page.slug,
      title: page.title,
      body: blocksToBody(page.blocks),
      published: page.published,
      metaTitle: page.metaTitle ?? null,
      metaDescription: page.metaDescription ?? null,
    }));
  }

  for (const page of pages) {
    const existing = await prisma.cmsPage.findFirst({
      where: { schoolId, slug: page.slug },
    });

    const data = {
      title: page.title,
      body: page.body,
      published: page.published,
      metaTitle: page.metaTitle ?? null,
      metaDescription: page.metaDescription ?? null,
      schoolId,
    };

    if (existing) {
      if (!force) {
        skipped.push(page.slug);
        continue;
      }
      await prisma.cmsPage.update({ where: { id: existing.id }, data });
      await prisma.cmsPageVersion.create({
        data: {
          pageId: existing.id,
          title: data.title,
          body: data.body,
          metaTitle: data.metaTitle,
          metaDescription: data.metaDescription,
          savedBy: session.userId,
        },
      });
      updated.push(page.slug);
    } else {
      const row = await prisma.cmsPage.create({ data });
      await prisma.cmsPageVersion.create({
        data: {
          pageId: row.id,
          title: data.title,
          body: data.body,
          metaTitle: data.metaTitle,
          metaDescription: data.metaDescription,
          savedBy: session.userId,
        },
      });
      created.push(page.slug);
    }
  }

  await logAudit({
    userId: session.userId,
    schoolId,
    action: mode === "from_template" ? "CMS_TEMPLATE_FROM_SCHOOL" : "INSTALL_CMS_PACK",
    entity: "CmsPage",
    entityId: schoolId,
    details: {
      slug: school.slug,
      mode,
      source: sourceMeta,
      created,
      updated,
      skipped,
      force,
    },
  });

  return NextResponse.json({
    ok: true,
    mode,
    source: sourceMeta,
    school: { id: school.id, slug: school.slug, name: school.name },
    created,
    updated,
    skipped,
    message:
      created.length || updated.length
        ? `${mode === "from_template" ? "Template" : "Pack"} applied: ${[...created, ...updated].join(", ")}${
            skipped.length ? ` (skipped: ${skipped.join(", ")})` : ""
          }`
        : skipped.length
          ? `All pages already exist (${skipped.join(", ")}). Use force to overwrite.`
          : "Nothing to install",
  });
}
