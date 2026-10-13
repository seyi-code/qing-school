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

  const pending = requests.filter((r) => r.status === "PENDING").length;
  const approved = requests.filter((r) => r.status === "APPROVED").length;
  const rejected = requests.filter((r) => r.status === "REJECTED").length;

  return (
    <PortalShell
      role={session.role}
      title="Staff Leave"
      subtitle={isManager ? "Review leave requests" : "Request time off"}
      email={session.email}
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-4 sm:mb-5">
        <Kpi label="Total" value={String(requests.length)} tone="navy" />
        <Kpi label="Pending" value={String(pending)} tone={pending ? "gold" : "sage"} />
        <Kpi label="Approved" value={String(approved)} tone="sage" />
        <Kpi label="Rejected" value={String(rejected)} tone="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {!isManager && (
          <section className="rounded-xl border border-sky-200/80 bg-gradient-to-br from-sky-50 to-white p-4 sm:p-5 shadow-sm">
            <h2 className="font-serif text-lg text-navy mb-3">New request</h2>
            {staff ? (
              <LeaveForm />
            ) : (
              <p className="text-sm text-ink/50">No staff profile linked to this account.</p>
            )}
          </section>
        )}

        <section
          className={`rounded-xl border border-violet-200/70 bg-gradient-to-br from-violet-50/40 to-white shadow-sm overflow-hidden ${
            isManager ? "lg:col-span-3" : "lg:col-span-2"
          }`}
        >
          <div className="p-4 pb-2">
            <h2 className="font-serif text-lg text-navy">{isManager ? "All requests" : "My requests"}</h2>
          </div>
          {requests.length === 0 ? (
            <p className="text-sm text-ink/50 text-center py-12 px-4">
              No leave requests for this school.
            </p>
          ) : (
            <div className="overflow-x-auto">
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
                        <td className="font-medium">
                          {r.staff.lastName}, {r.staff.firstName}
                        </td>
                      )}
                      <td className="tabular-nums text-sm">{formatDate(r.startDate)}</td>
                      <td className="tabular-nums text-sm">{formatDate(r.endDate)}</td>
                      <td className="text-sm max-w-[12rem] truncate" title={r.reason}>
                        {r.reason}
                      </td>
                      <td>
                        <span
                          className={`status-pill text-[10px] ${
                            r.status === "APPROVED"
                              ? "text-sage"
                              : r.status === "PENDING"
                                ? "text-gold-dark"
                                : "text-brick"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      {isManager && (
                        <td>
                          {r.status === "PENDING" ? (
                            <LeaveReviewButtons id={r.id} />
                          ) : (
                            <span className="text-xs text-ink/40">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </PortalShell>
  );
}

const TONE: Record<string, string> = {
  navy: "from-[#1a3a6e]/[12%] to-white border-navy/15",
  sage: "from-emerald-500/[12%] to-white border-emerald-500/20",
  rose: "from-rose-500/[12%] to-white border-rose-500/20",
  gold: "from-amber-500/[12%] to-white border-amber-500/25",
};

function Kpi({ label, value, tone }: { label: string; value: string; tone: keyof typeof TONE }) {
  return (
    <div className={`rounded-xl border bg-gradient-to-br px-3.5 py-3 shadow-sm ${TONE[tone]}`}>
      <p className="text-[10px] font-medium uppercase tracking-wide text-ink/50">{label}</p>
      <p className="mt-1 text-lg sm:text-xl font-semibold text-ink tabular-nums">{value}</p>
    </div>
  );
}
