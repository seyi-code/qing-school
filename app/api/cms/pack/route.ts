import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { resolveSchoolId } from "@/lib/tenant-scope";
import { buildCmsPackForSchool, blocksToBody } from "@/lib/cms-packs";

const Schema = z.object({
  /** Optional: platform admin installing for a specific school */
  schoolId: z.string().optional(),
  /** Overwrite existing pages with the same slug */
  force: z.boolean().optional(),
});

/**
 * Install the default CMS pack (home, about, admissions, contact) for the active school.
 * Skips slugs that already exist unless force=true.
 */
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

  const pack = buildCmsPackForSchool({
    name: school.name,
    shortName: school.shortName,
    slug: school.slug,
    motto: school.motto,
  });

  const force = Boolean(parsed.data.force);
  const created: string[] = [];
  const updated: string[] = [];
  const skipped: string[] = [];

  for (const page of pack) {
    const existing = await prisma.cmsPage.findFirst({
      where: { schoolId, slug: page.slug },
    });

    const data = {
      title: page.title,
      body: blocksToBody(page.blocks),
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
      await prisma.cmsPage.update({
        where: { id: existing.id },
        data,
      });
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
      const row = await prisma.cmsPage.create({
        data: {
          slug: page.slug,
          ...data,
        },
      });
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
    action: "INSTALL_CMS_PACK",
    entity: "CmsPage",
    entityId: schoolId,
    details: { slug: school.slug, created, updated, skipped, force },
  });

  return NextResponse.json({
    ok: true,
    school: { id: school.id, slug: school.slug, name: school.name },
    created,
    updated,
    skipped,
    message:
      created.length || updated.length
        ? `Pack applied: ${[...created, ...updated].join(", ")}${skipped.length ? ` (skipped existing: ${skipped.join(", ")})` : ""}`
        : skipped.length
          ? `All pack pages already exist (${skipped.join(", ")}). Use force to overwrite.`
          : "Nothing to install",
  });
}
