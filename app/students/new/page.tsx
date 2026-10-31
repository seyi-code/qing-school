import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { PortalShell } from "@/components/PortalShell";
import { can } from "@/lib/permissions";
import { resolveSchoolId } from "@/lib/tenant-scope";
import { redirect } from "next/navigation";
import { AdmissionForm } from "./AdmissionForm";

export const dynamic = "force-dynamic";

export default async function NewStudentPage() {
  const session = await requireSession();
  if (!can(session.role, "MANAGE_STUDENTS")) redirect("/students");

  const schoolId = await resolveSchoolId(session);

  const arms = await prisma.arm.findMany({
    where: schoolId ? { schoolClass: { schoolId } } : undefined,
    include: { schoolClass: true },
    orderBy: [{ schoolClass: { order: "asc" } }, { name: "asc" }],
  });

  return (
    <PortalShell
      role={session.role}
      title="Admit a New Student"
      subtitle="Online / offline admission form"
      email={session.email}
      actions={
        <Link href="/students" className="btn-ghost text-sm">
          ← Students
        </Link>
      }
    >
      <div className="max-w-2xl rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 to-white p-4 sm:p-5 shadow-sm">
        <AdmissionForm
          arms={arms.map((a) => ({ id: a.id, label: `${a.schoolClass.name} ${a.name}` }))}
        />
      </div>
    </PortalShell>
  );
}
