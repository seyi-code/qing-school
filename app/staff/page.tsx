import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { PortalShell } from "@/components/PortalShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { resolveSchoolId, schoolWhere } from "@/lib/tenant-scope";
import { toMoney } from "@/lib/money";
import { StaffTable } from "./StaffTable";
import { Kpi } from "@/components/ui/Kpi";
import { RepairStaffIdsButton } from "@/components/RepairStaffIdsButton";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const session = await requireSession();
  const schoolId = await resolveSchoolId(session);

  if (schoolId) {
    await prisma.staff.updateMany({
      where: { schoolId: null },
      data: { schoolId },
    });
  }

  const staff = await prisma.staff.findMany({
    where: schoolWhere(schoolId),
    include: { user: { select: { email: true, role: true, isActive: true } } },
    orderBy: [{ lastName: "asc" }],
  });

  const active = staff.filter((s) => s.isActive && s.user.isActive).length;
  const teaching = staff.filter((s) => s.category === "TEACHING").length;
  const nonTeaching = staff.length - teaching;

  return (
    <PortalShell
      role={session.role}
      title="Staff"
      subtitle={`${staff.length} on record · roles, status, salary, password reset`}
      email={session.email}
      actions={
        <Link href="/staff/new" className="btn-primary">
          + Add Staff
        </Link>
      }
    >
      <div className="mb-3">
        <RepairStaffIdsButton />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <Kpi label="Total staff" value={String(staff.length)} tone="navy" icon="👥" />
        <Kpi label="Active" value={String(active)} tone="sage" icon="✓" />
        <Kpi label="Teaching" value={String(teaching)} tone="violet" icon="📚" />
        <Kpi label="Non-teaching" value={String(nonTeaching)} tone="gold" icon="#" />
      </div>

      {staff.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No staff yet"
          description="Add teaching and non-teaching staff so roles, payroll and class teachers work."
          action={
            <Link href="/staff/new" className="btn-primary">
              + Add Staff
            </Link>
          }
        />
      ) : (
        <StaffTable
          rows={staff.map((s) => ({
            id: s.id,
            staffId: s.staffId,
            firstName: s.firstName,
            lastName: s.lastName,
            designation: s.designation,
            category: s.category,
            phone: s.phone,
            monthlySalary: s.monthlySalary == null ? null : toMoney(s.monthlySalary),
            isActive: s.isActive && s.user.isActive,
            email: s.user.email,
            role: s.user.role,
          }))}
        />
      )}
    </PortalShell>
  );
}
