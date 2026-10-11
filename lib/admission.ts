/**
 * Admission numbers: SCHOOL/BRANCH/YEAR/####
 * Example: KMS/MAT/2026/0001, TEST/LAG/2026/0001
 */
import { prisma } from "@/lib/db";

function sanitizeTag(raw: string, fallback: string, max = 6): string {
  const t = raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, max);
  return t || fallback;
}

/** Ensure school has at least one branch (MAIN). Returns default branch. */
export async function ensureDefaultBranch(schoolId: string) {
  const existing = await prisma.branch.findFirst({
    where: { schoolId },
    orderBy: [{ isDefault: "desc" }, { code: "asc" }],
  });
  if (existing) return existing;

  return prisma.branch.create({
    data: {
      schoolId,
      code: "MAIN",
      name: "Main campus",
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
