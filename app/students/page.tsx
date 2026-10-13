import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { resolveSchoolId } from "@/lib/tenant-scope";
import { PortalShell } from "@/components/PortalShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { ApproveStudentButton } from "@/components/ApproveStudentButton";
import { BulkAssignClass } from "@/components/BulkAssignClass";
import { can, homeRouteForRole } from "@/lib/permissions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["PLATFORM_ADMIN", "ADMIN", "IT", "SECRETARY", "PRINCIPAL", "TEACHER"];

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string };
}) {
  const session = await requireSession();
  const schoolId = await resolveSchoolId(session);
  if (!ALLOWED_ROLES.includes(session.role)) redirect(homeRouteForRole(session.role));

  const q = searchParams.q?.trim();
  const statusFilter = searchParams.status || "ACTIVE";
  const canAdmit = can(session.role, "MANAGE_STUDENTS");

  const [students, appliedCount, activeCount, unassignedCount, arms] = await Promise.all([
    prisma.student.findMany({
      where: {
        status: statusFilter,
        ...(schoolId ? { schoolId } : {}),
        ...(q
          ? {
              OR: [
                { firstName: { contains: q } },
                { lastName: { contains: q } },
                { admissionNumber: { contains: q } },
              ],
            }
          : {}),
      },
      include: { arm: { include: { schoolClass: true } } },
      orderBy: [{ lastName: "asc" }],
      take: 200,
    }),
    prisma.student.count({ where: { status: "APPLIED", ...(schoolId ? { schoolId } : {}) } }),
    prisma.student.count({ where: { status: "ACTIVE", ...(schoolId ? { schoolId } : {}) } }),
    prisma.student.count({
      where: { status: "ACTIVE", armId: null, ...(schoolId ? { schoolId } : {}) },
    }),
    prisma.arm.findMany({
      where: schoolId ? { schoolClass: { schoolId } } : undefined,
      include: { schoolClass: true },
      orderBy: [{ schoolClass: { order: "asc" } }, { name: "asc" }],
    }),
  ]);

  const tabs = [
    { key: "ACTIVE", label: "Active" },
    { key: "APPLIED", label: `Applications${appliedCount ? ` (${appliedCount})` : ""}` },
    { key: "WITHDRAWN", label: "Withdrawn" },
    { key: "GRADUATED", label: "Graduated" },
  ];

  return (
    <PortalShell
      role={session.role}
      title="Students"
      subtitle={`${students.length} shown`}
      email={session.email}
      actions={
        canAdmit ? (
          <div className="flex flex-wrap gap-2">
            <a href={`/api/students/export?status=${statusFilter}`} className="btn-ghost">
              Export CSV
            </a>
            <Link href="/students/new" className="btn-primary">
              + Admit Student
            </Link>
          </div>
        ) : undefined
      }
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-4">
        <div className="rounded-xl border border-blue-200/90 bg-gradient-to-br from-blue-50 to-white px-3.5 py-3 shadow-sm">
          <p className="text-[10px] uppercase tracking-wide font-medium text-blue-700/70">Active</p>
          <p className="mt-1 text-xl font-semibold text-blue-900 tabular-nums">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50 to-white px-3.5 py-3 shadow-sm">
          <p className="text-[10px] uppercase tracking-wide font-medium text-amber-800/70">Applications</p>
          <p className="mt-1 text-xl font-semibold text-amber-900 tabular-nums">{appliedCount}</p>
        </div>
        <div className="rounded-xl border border-rose-200/90 bg-gradient-to-br from-rose-50 to-white px-3.5 py-3 shadow-sm">
          <p className="text-[10px] uppercase tracking-wide font-medium text-rose-700/70">Unassigned</p>
          <p className="mt-1 text-xl font-semibold text-rose-800 tabular-nums">{unassignedCount}</p>
        </div>
        <div className="rounded-xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50 to-white px-3.5 py-3 shadow-sm">
          <p className="text-[10px] uppercase tracking-wide font-medium text-emerald-700/70">In this list</p>
          <p className="mt-1 text-xl font-semibold text-emerald-800 tabular-nums">{students.length}</p>
        </div>
      </div>

      <div className="tab-bar">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={`/students?status=${tab.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className="tab-pill"
            data-active={statusFilter === tab.key ? "true" : "false"}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <form className="mb-4 flex flex-wrap gap-2" method="GET">
        <input type="hidden" name="status" value={statusFilter} />
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by name or admission number..."
          className="border border-line px-3 py-2 text-sm flex-1 min-w-[12rem] rounded-lg bg-white"
        />
        <button type="submit" className="btn-ghost">
          Search
        </button>
      </form>

      {canAdmit && (
        <BulkAssignClass
          arms={arms.map((a) => ({
            id: a.id,
            label: `${a.schoolClass.name} ${a.name}`,
          }))}
          students={students.map((s) => ({
            id: s.id,
            name: `${s.lastName}, ${s.firstName}`,
            admissionNumber: s.admissionNumber,
            unassigned: !s.armId,
          }))}
        />
      )}

      {students.length === 0 && (
        <EmptyState
          title="No students in this list"
          description="Admit a student or switch the status tab above."
          action={
            canAdmit ? (
              <Link href="/students/new" className="btn-primary">
                + Admit student
              </Link>
            ) : undefined
          }
        />
      )}

      <div className="md:hidden space-y-2 mb-4">
        {students.map((s) => (
          <Link
            key={s.id}
            href={`/students/${s.id}`}
            className="block rounded-xl border border-sky-100 bg-gradient-to-br from-white to-sky-50/40 p-3 shadow-sm hover:border-navy/30 transition-colors"
          >
            <div className="flex justify-between gap-2">
              <span className="font-medium text-sm">
                {s.lastName}, {s.firstName}
              </span>
              <span className="status-pill text-[10px]">{s.status}</span>
            </div>
            <p className="text-xs font-mono text-ink/50 mt-1">{s.admissionNumber}</p>
            <p className="text-xs text-ink/60 mt-0.5">
              {s.arm ? `${s.arm.schoolClass.name} ${s.arm.name}` : "Unassigned"}
            </p>
          </Link>
        ))}
      </div>

      <div className="hidden md:block ledger-block !p-0 overflow-x-auto">
        <table className="ledger">
          <thead>
            <tr>
              <th>Admission No.</th>
              <th>Name</th>
              <th>Class / Arm</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id}>
                <td className="font-mono text-xs">{s.admissionNumber}</td>
                <td>
                  {s.lastName}, {s.firstName} {s.otherNames ?? ""}
                </td>
                <td>
                  {s.arm ? (
                    `${s.arm.schoolClass.name} ${s.arm.name}`
                  ) : (
                    <span className="text-ink/40">Unassigned</span>
                  )}
                </td>
                <td>
                  <span className="status-pill text-xs">{s.status}</span>
                </td>
                <td className="space-x-2 whitespace-nowrap">
                  <Link
                    href={`/students/${s.id}`}
                    className="text-navy text-sm font-medium hover:underline"
                  >
                    {canAdmit && !s.arm ? "Assign class" : "View"}
                  </Link>
                  {s.status === "APPLIED" && canAdmit && (
                    <ApproveStudentButton studentId={s.id} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PortalShell>
  );
}
