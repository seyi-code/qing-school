import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const Schema = z.object({
  schoolId: z.string().min(1),
  customDomain: z
    .string()
    .max(120)
    .regex(/^[a-z0-9.-]*$/, "lowercase domain only")
    .optional()
    .nullable(),
  verify: z.boolean().optional(),
  clear: z.boolean().optional(),
});

/** Phase 4: attach / verify custom domain for a school's public site. PLATFORM_ADMIN only. */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid domain payload" }, { status: 400 });
  }

  const { schoolId, customDomain, verify, clear } = parsed.data;
  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) {
    return NextResponse.json({ error: "School not found" }, { status: 404 });
  }

  let data: { customDomain?: string | null; domainVerifiedAt?: Date | null } = {};

  if (clear) {
    data = { customDomain: null, domainVerifiedAt: null };
  } else if (customDomain !== undefined) {
    const host = (customDomain || "")
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .split("/")[0];
    if (host) {
      const taken = await prisma.school.findFirst({
        where: { customDomain: host, NOT: { id: schoolId } },
      });
      if (taken) {
        return NextResponse.json({ error: "Domain already used by another school" }, { status: 409 });
      }
      data.customDomain = host;
      data.domainVerifiedAt = null;
    } else {
      data.customDomain = null;
      data.domainVerifiedAt = null;
    }
  }

  if (verify) {
    if (!school.customDomain && !data.customDomain) {
      return NextResponse.json({ error: "Set a domain before verifying" }, { status: 400 });
    }
    data.domainVerifiedAt = new Date();
  }

  const updated = await prisma.school.update({
    where: { id: schoolId },
    data,
    select: {
      id: true,
      slug: true,
      name: true,
      customDomain: true,
      domainVerifiedAt: true,
    },
  });

  await logAudit({
    userId: session.userId,
    schoolId,
    action: verify ? "VERIFY_CUSTOM_DOMAIN" : clear ? "CLEAR_CUSTOM_DOMAIN" : "SET_CUSTOM_DOMAIN",
    entity: "School",
    entityId: schoolId,
    details: JSON.stringify({
      customDomain: updated.customDomain,
      verified: Boolean(updated.domainVerifiedAt),
    }),
  });

  return NextResponse.json({ school: updated });
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "PLATFORM_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const schoolId = new URL(req.url).searchParams.get("schoolId");
  if (!schoolId) {
    return NextResponse.json({ error: "schoolId required" }, { status: 400 });
  }
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { id: true, slug: true, name: true, customDomain: true, domainVerifiedAt: true },
  });
  if (!school) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ school });
}
