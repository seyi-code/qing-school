import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { PortalShell } from "@/components/PortalShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { resolveSchoolId, schoolWhere } from "@/lib/tenant-scope";
import { toMoney } from "@/lib/money";
import { StaffTable } from "./StaffTable";

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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="rounded-xl border border-blue-200/90 bg-gradient-to-br from-blue-50 to-white px-3.5 py-3 shadow-sm">
          <p className="text-[10px] uppercase tracking-wide font-medium text-blue-700/70">Total staff</p>
          <p className="mt-1.5 text-xl font-semibold tabular-nums text-blue-900">{staff.length}</p>
        </div>
        <div className="rounded-xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50 to-white px-3.5 py-3 shadow-sm">
          <p className="text-[10px] uppercase tracking-wide font-medium text-emerald-700/70">Active</p>
          <p className="mt-1.5 text-xl font-semibold tabular-nums text-emerald-800">{active}</p>
        </div>
        <div className="rounded-xl border border-violet-200/90 bg-gradient-to-br from-violet-50 to-white px-3.5 py-3 shadow-sm">
          <p className="text-[10px] uppercase tracking-wide font-medium text-violet-700/70">Teaching</p>
          <p className="mt-1.5 text-xl font-semibold tabular-nums text-violet-900">{teaching}</p>
        </div>
        <div className="rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50 to-white px-3.5 py-3 shadow-sm">
          <p className="text-[10px] uppercase tracking-wide font-medium text-amber-800/70">Non-teaching</p>
          <p className="mt-1.5 text-xl font-semibold tabular-nums text-amber-900">{nonTeaching}</p>
        </div>
      </div>

      {staff.length === 0 ? (
        <EmptyState
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
