import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { PortalShell } from "@/components/PortalShell";
import { formatDate } from "@/lib/format";
import { resolveSchoolId } from "@/lib/tenant-scope";
import { LeaveForm } from "./LeaveForm";
import { LeaveReviewButtons } from "./LeaveReviewButtons";

export const dynamic = "force-dynamic";

export default async function LeavePage() {
  const session = await requireSession();
  const isManager = ["ADMIN", "IT", "PRINCIPAL", "PLATFORM_ADMIN"].includes(session.role);
  const schoolId = await resolveSchoolId(session);

  const staff = await prisma.staff.findUnique({ where: { userId: session.userId } });

  const requests = isManager
    ? await prisma.leaveRequest.findMany({
        where: schoolId ? { staff: { schoolId } } : undefined,
        include: { staff: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
    : staff
      ? await prisma.leaveRequest.findMany({
          where: { staffId: staff.id },
          include: { staff: true },
          orderBy: { createdAt: "desc" },
        })
      : [];

  return (
    <PortalShell
      role={session.role}
      title="Staff Leave"
      subtitle={isManager ? "Review leave requests" : "Request time off"}
      email={session.email}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {!isManager && (
          <section className="ledger-block">
            <h2 className="font-serif text-lg mb-3">New request</h2>
            {staff ? (
              <LeaveForm />
            ) : (
              <p className="text-sm text-ink/50">No staff profile linked to this account.</p>
            )}
          </section>
        )}

        <section className={`ledger-block !p-0 overflow-x-auto ${isManager ? "lg:col-span-3" : "lg:col-span-2"}`}>
          <div className="p-4">
            <h2 className="font-serif text-lg">{isManager ? "All requests" : "My requests"}</h2>
          </div>
          <table className="ledger">
            <thead>
              <tr>
                {isManager && <th>Staff</th>}
                <th>From</th>
                <th>To</th>
                <th>Reason</th>
                <th>Status</th>
                {isManager && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  {isManager && (
                    <td>
                      {r.staff.firstName} {r.staff.lastName}
                    </td>
                  )}
                  <td className="text-xs whitespace-nowrap">{formatDate(r.startDate)}</td>
                  <td className="text-xs whitespace-nowrap">{formatDate(r.endDate)}</td>
                  <td className="max-w-xs">{r.reason}</td>
                  <td>
                    <span className="status-pill text-xs">{r.status}</span>
                  </td>
                  {isManager && (
                    <td>{r.status === "PENDING" && <LeaveReviewButtons id={r.id} />}</td>
                  )}
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={isManager ? 6 : 4} className="text-center text-ink/50 py-8">
                    No leave requests for this school.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </PortalShell>
  );
}
