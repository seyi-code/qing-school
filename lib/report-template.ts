import { prisma } from "@/lib/db";

export type ReportTemplateConfig = {
  schoolName?: string;
  motto?: string;
  footerNote?: string;
  principalTitle?: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
  sessionLabel?: string;
  termLabel?: string;
  teacherRemark?: string;
  principalRemark?: string;
  domainsMode?: "auto" | "primary" | "secondary" | "hidden";
};

/** Load this school's report template only (never another tenant's). */
export async function getSchoolReportTemplate(schoolId: string | null | undefined) {
  if (!schoolId) return null;
  return prisma.reportCardTemplate.findFirst({
    where: { name: `school:${schoolId}` },
    orderBy: { updatedAt: "desc" },
  });
}
