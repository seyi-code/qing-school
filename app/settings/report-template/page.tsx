import Link from "next/link";
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
    prisma.reportCardTemplate.findUnique({ where: { name } }),
    schoolId
      ? prisma.school.findUnique({
          where: { id: schoolId },
          select: { name: true, shortName: true, logoUrl: true },
        })
      : Promise.resolve(null),
  ]);

  return (
    <PortalShell
      role={session.role}
      title="Report card template"
      subtitle="Header, logo, and grading notes for printed report cards"
      email={session.email}
      actions={
        <Link href="/settings" className="btn-ghost text-sm">
          ← Settings
        </Link>
      }
    >
      <div className="max-w-2xl">
        <ReportTemplateForm
          schoolName={school?.name ?? "School"}
          schoolShortName={school?.shortName ?? ""}
          initial={{
            headerText: tpl?.headerText ?? "",
            footerText: tpl?.footerText ?? "",
            logoUrl: tpl?.logoUrl ?? school?.logoUrl ?? "",
            showPosition: tpl?.showPosition ?? true,
            showAverage: tpl?.showAverage ?? true,
            showGrade: tpl?.showGrade ?? true,
            showRemark: tpl?.showRemark ?? true,
          }}
        />
      </div>
    </PortalShell>
  );
}
