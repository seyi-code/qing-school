import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resolveSchoolId } from "@/lib/tenant-scope";

/** Session + active school context for header / sidebar. */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const schoolId = await resolveSchoolId(session);
  let school: { id: string; name: string; shortName: string; plan: string; slug: string } | null =
    null;
  if (schoolId) {
    school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true, shortName: true, plan: true, slug: true },
    });
  }

  return NextResponse.json({
    email: session.email,
    role: session.role,
    userId: session.userId,
    schoolId: schoolId ?? null,
    schoolName: school?.name ?? null,
    schoolShortName: school?.shortName ?? null,
    schoolPlan: school?.plan ?? null,
    schoolSlug: school?.slug ?? null,
  });
}
