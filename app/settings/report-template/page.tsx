import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { PortalShell } from "@/components/PortalShell";
import { homeRouteForRole } from "@/lib/permissions";
import { resolveSchoolId } from "@/lib/tenant-scope";
import { redirect } from "next/navigation";
import { ReportTemplateForm } from "./ReportTemplateForm";

export const dynamic = "force-dynamic";

export default async function ReportTemplatePage() {
  const session = await requireSession();
  if (!["ADMIN", "IT", "PRINCIPAL", "PLATFORM_ADMIN"].includes(session.role)) {
    redirect(homeRouteForRole(session.role));
  }

  const schoolId = await resolveSchoolId(session);
  const name = schoolId ? `school:${schoolId}` : "Default";

  const [tpl, school] = await Promise.all([
    prisma.reportCardTemplate.findFirst({
      where: { name },
      orderBy: { updatedAt: "desc" },
    }),
    schoolId
      ? prisma.school.findUnique({
          where: { id: schoolId },
          select: {
            name: true,
            motto: true,
            logoUrl: true,
            primaryColor: true,
            accentColor: true,
          },
        })
      : null,
  ]);

  const config = tpl
    ? JSON.parse(tpl.configJson)
    : {
        schoolName: school?.name || "Your School",
        motto: school?.motto || "",
        footerNote: "This is a computer-generated report.",
        showPosition: true,
        showAttendance: true,
        principalTitle: "Principal",
        headerBg: school?.primaryColor || "#0f2748",
        accentColor: school?.accentColor || "#c9a227",
        logoUrl: school?.logoUrl || "/logo.svg",
        domainsMode: "auto",
        sections: [
          "header",
          "studentInfo",
          "scoresTable",
          "attendance",
          "position",
          "remarks",
          "signatures",
          "footer",
        ],
      };

  return (
    <PortalShell
      role={session.role}
      title="Report card designer"
      subtitle="Logo, colours, section order — for this school only"
      email={session.email}
    >
      <ReportTemplateForm initial={config} />
      <p className="text-xs text-ink/50 mt-4">
        Each school has its own layout. Changes here do not affect other tenants. The printed card on a
        student profile uses the full design (navy/gold); this preview is a simplified layout check.
      </p>
    </PortalShell>
  );
}
