import Link from "next/link";
import { requireSession } from "@/lib/require-session";
import { PortalShell } from "@/components/PortalShell";
import { can } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { AdmitStudentForm } from "./AdmitStudentForm";

export default async function AdmitStudentPage() {
  const session = await requireSession();
  if (!can(session.role, "MANAGE_STUDENTS")) redirect("/students");

  return (
    <PortalShell
      role={session.role}
      title="Admit student"
      subtitle="Create a student record and admission number"
      email={session.email}
      actions={
        <Link href="/students" className="btn-ghost text-sm">
          ← Students
        </Link>
      }
    >
      <div className="max-w-2xl">
        <AdmitStudentForm />
      </div>
    </PortalShell>
  );
}
