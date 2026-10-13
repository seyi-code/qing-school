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

  const [students, appliedCount, arms] = await Promise.all([
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
              + Admit student
            </Link>
          </div>
        ) : undefined
      }
    >
      <div className="flex flex-wrap gap-2 mb-4 tab-bar">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={`/students?status=${tab.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={
              statusFilter === tab.key
                ? "tab-pill tab-pill-active"
                : "tab-pill"
            }
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <form method="get" className="mb-4 flex flex-wrap gap-2">
        <input type="hidden" name="status" value={statusFilter} />
        <input
          name="q"
          defaultValue={q || ""}
          placeholder="Search name or admission no."
          className="border border-line rounded-lg px-3 py-2 text-sm flex-1 min-w-[12rem] bg-white"
        />
        <button type="submit" className="btn-ghost">
          Search
        </button>
      </form>

      {canAdmit && statusFilter === "ACTIVE" && (
        <BulkAssignClass
          arms={arms.map((a) => ({
            id: a.id,
            label: `${a.schoolClass.name} ${a.name}`,
          }))}
          students={students.map((s) => ({
            id: s.id,
            name: `${s.lastName}, ${s.firstName}`,
            armId: s.armId,
          }))}
        />
      )}

      {students.length === 0 && (
        <EmptyState
          title="No students in this list"
          description="Try another tab or admit a new student."
          action={
            canAdmit ? (
              <Link href="/students/new" className="btn-primary">
                + Admit student
              </Link>
            ) : undefined
          }
        />
      )}

      {/* Mobile cards */}
      <div className="sm:hidden space-y-2">
        {students.map((s) => (
          <Link
            key={s.id}
            href={`/students/${s.id}`}
            className="ledger-block !p-3 block"
          >
            <p className="font-medium text-ink">
              {s.lastName}, {s.firstName}
            </p>
            <p className="text-xs text-ink/50 font-mono mt-0.5">{s.admissionNumber}</p>
            <p className="text-xs text-ink/60 mt-1">
              {s.arm
                ? `${s.arm.schoolClass.name} ${s.arm.name}`
                : "Unassigned"}
            </p>
            <span className="status-pill text-xs mt-2 inline-block">{s.status}</span>
          </Link>
        ))}
      </div>

      <div className="hidden sm:block table-wrap">
        <table className="ledger">
          <thead>
            <tr>
              <th>Name</th>
              <th>Admission</th>
              <th>Class</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id}>
                <td className="font-medium">
                  {s.lastName}, {s.firstName}
                </td>
                <td className="font-mono text-xs">{s.admissionNumber}</td>
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
