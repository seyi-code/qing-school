import { requireSession } from "@/lib/require-session";
import { PortalShell } from "@/components/PortalShell";
import { can } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { StaffForm } from "./StaffForm";

export default async function NewStaffPage() {
  const session = await requireSession();
  if (!can(session.role, "MANAGE_STAFF")) redirect("/staff");

  return (
    <PortalShell
      role={session.role}
      title="Add Staff"
      subtitle="Creates a staff profile and their portal login"
      email={session.email}
    >
      <div className="max-w-xl rounded-xl border border-sky-200/80 bg-gradient-to-br from-sky-50 to-white p-4 sm:p-5 shadow-sm">
        <StaffForm />
      </div>
    </PortalShell>
  );
}
