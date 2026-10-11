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
    >
      <div className="max-w-2xl">
        <AdmissionForm
          arms={arms.map((a) => ({ id: a.id, label: `${a.schoolClass.name} ${a.name}` }))}
        />
      </div>
    </PortalShell>
  );
}
