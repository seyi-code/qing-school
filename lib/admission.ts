/**
 * Admission numbers: SCHOOL/BRANCH/YEAR/####
 * Example: KMS/MAT/2026/0001, TEST/MAIN/2026/0001, DMS/MAIN/2026/0001
 */
import { prisma } from "@/lib/db";

function sanitizeTag(raw: string, fallback: string, max = 6): string {
  const t = raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, max);
  return t || fallback;
}

/** Preferred default branch per school slug / location. */
function defaultBranchForSchool(school: {
  slug: string;
  location: string | null;
}): { code: string; name: string } {
  const slug = (school.slug || "").toLowerCase();
  const loc = (school.location || "").toLowerCase();

  if (slug === "kms" || loc.includes("matogun")) {
    return { code: "MAT", name: "Matogun campus" };
  }
  if (slug === "test") {
    return { code: "MAIN", name: "Main campus" };
  }
  if (slug === "dms") {
    return { code: "MAIN", name: "Main campus" };
  }
  return { code: "MAIN", name: "Main campus" };
}

/** Ensure school has at least one branch. Returns preferred default. */
export async function ensureDefaultBranch(schoolId: string) {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { slug: true, location: true },
  });
  const preferred = defaultBranchForSchool({
    slug: school?.slug || "",
    location: school?.location ?? null,
  });

  // Prefer existing branch with the preferred code
  const byCode = await prisma.branch.findFirst({
    where: { schoolId, code: preferred.code },
  });
  if (byCode) {
    if (!byCode.isDefault) {
      await prisma.branch.updateMany({
        where: { schoolId, isDefault: true },
        data: { isDefault: false },
      });
      return prisma.branch.update({
        where: { id: byCode.id },
        data: { isDefault: true },
      });
    }
    return byCode;
  }

  // Any existing default branch
  const existingDefault = await prisma.branch.findFirst({
    where: { schoolId, isDefault: true },
  });
  if (existingDefault) return existingDefault;

  // Any branch
  const any = await prisma.branch.findFirst({
    where: { schoolId },
    orderBy: { code: "asc" },
  });
  if (any) return any;

  return prisma.branch.create({
    data: {
      schoolId,
      code: preferred.code,
      name: preferred.name,
      isDefault: true,
    },
  });
}

export async function listBranches(schoolId: string) {
  await ensureDefaultBranch(schoolId);
  return prisma.branch.findMany({
    where: { schoolId },
    orderBy: [{ isDefault: "desc" }, { code: "asc" }],
  });
}

/**
 * Next admission number for a school + branch.
 * Format: {shortName}/{branchCode}/{year}/{seq}
 * e.g. KMS/MAT/2026/0001
 */
export async function generateAdmissionNumber(
  schoolId: string | null,
  branchId?: string | null
): Promise<{ admissionNumber: string; branchId: string | null }> {
  const year = new Date().getFullYear();

  if (!schoolId) {
    const prefix = `SCH/MAIN/${year}/`;
    const last = await prisma.student.findFirst({
      where: { admissionNumber: { startsWith: prefix } },
      orderBy: { admissionNumber: "desc" },
      select: { admissionNumber: true },
    });
    let next = 1;
    if (last?.admissionNumber) {
      const n = parseInt(last.admissionNumber.split("/").pop() || "0", 10);
      if (!Number.isNaN(n)) next = n + 1;
    }
    return {
      admissionNumber: `${prefix}${String(next).padStart(4, "0")}`,
      branchId: null,
    };
  }

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { shortName: true },
  });
  const schoolTag = sanitizeTag(school?.shortName || "SCH", "SCH");

  let branch = branchId
    ? await prisma.branch.findFirst({ where: { id: branchId, schoolId } })
    : null;
  if (!branch) {
    branch = await ensureDefaultBranch(schoolId);
  }
  const branchTag = sanitizeTag(branch.code, "MAIN", 8);

  const prefix = `${schoolTag}/${branchTag}/${year}/`;
  const last = await prisma.student.findFirst({
    where: {
      schoolId,
      admissionNumber: { startsWith: prefix },
    },
    orderBy: { admissionNumber: "desc" },
    select: { admissionNumber: true },
  });
  let next = 1;
  if (last?.admissionNumber) {
    const n = parseInt(last.admissionNumber.split("/").pop() || "0", 10);
    if (!Number.isNaN(n)) next = n + 1;
  }

  return {
    admissionNumber: `${prefix}${String(next).padStart(4, "0")}`,
    branchId: branch.id,
  };
}

/**
 * Rewrite students whose admission number does not start with the school shortName
 * (e.g. legacy FS/2026/0003 → KMS/MAT/2026/0001).
 * Safe to run many times. Returns count fixed.
 */
export async function repairLegacyAdmissionNumbers(
  schoolId?: string | null
): Promise<{ fixed: number; details: Array<{ from: string; to: string }> }> {
  const schools = await prisma.school.findMany({
    where: schoolId ? { id: schoolId } : { isActive: true },
    select: { id: true, shortName: true, slug: true },
  });

  const details: Array<{ from: string; to: string }> = [];
  let fixed = 0;

  for (const school of schools) {
    const tag = sanitizeTag(school.shortName || school.slug || "SCH", "SCH");
    const students = await prisma.student.findMany({
      where: { schoolId: school.id },
      select: { id: true, admissionNumber: true, branchId: true },
      orderBy: { createdAt: "asc" },
    });

    for (const st of students) {
      const current = st.admissionNumber || "";
      if (current.toUpperCase().startsWith(tag + "/")) continue;

      const { admissionNumber, branchId } = await generateAdmissionNumber(
        school.id,
        st.branchId
      );

      // Avoid rare collision if generate somehow returns same
      if (admissionNumber === current) continue;

      try {
        await prisma.student.update({
          where: { id: st.id },
          data: {
            admissionNumber,
            ...(branchId && !st.branchId ? { branchId } : {}),
          },
        });
        details.push({ from: current, to: admissionNumber });
        fixed += 1;
      } catch (err) {
        console.warn("[repairLegacyAdmissionNumbers] skip", current, err);
      }
    }
  }

  return { fixed, details };
}
