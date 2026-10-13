import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { PortalShell } from "@/components/PortalShell";
import { formatNaira } from "@/lib/format";
import { can } from "@/lib/permissions";
import { resolveSchoolId } from "@/lib/tenant-scope";
import { toMoney } from "@/lib/money";
import { redirect } from "next/navigation";
import { PayrollRunner } from "./PayrollRunner";

export const dynamic = "force-dynamic";

export default async function PayrollPage() {
  const session = await requireSession();
  if (!can(session.role, "MANAGE_PAYROLL")) redirect("/dashboard");

  const schoolId = await resolveSchoolId(session);

  const payslips = await prisma.payslip.findMany({
    where: schoolId ? { staff: { schoolId } } : undefined,
    include: { staff: true },
    orderBy: { generatedAt: "desc" },
    take: 50,
  });

  const grossSum = payslips.reduce((s, p) => s + toMoney(p.gross), 0);
  const netSum = payslips.reduce((s, p) => s + toMoney(p.net), 0);

  return (
    <PortalShell
      role={session.role}
      title="Payroll"
      subtitle="Salary structure, deductions, payslip generation"
      email={session.email}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 mb-4 sm:mb-5">
        <Kpi label="Payslips" value={String(payslips.length)} tone="navy" />
        <Kpi label="Gross (listed)" value={formatNaira(grossSum)} tone="gold" />
        <Kpi label="Net (listed)" value={formatNaira(netSum)} tone="sage" />
      </div>

      <PayrollRunner />

      <section className="mt-5 rounded-xl border border-violet-200/70 bg-gradient-to-br from-violet-50/40 to-white shadow-sm overflow-hidden">
        <div className="p-4 pb-2">
          <h2 className="font-serif text-lg text-navy">Recent Payslips</h2>
        </div>
        {payslips.length === 0 ? (
          <p className="text-sm text-ink/50 text-center py-10 px-4">No payslips for this school yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="ledger">
              <thead>
                <tr>
                  <th>Staff</th>
                  <th>Month</th>
                  <th>Gross</th>
                  <th>Deductions</th>
                  <th>Net</th>
                </tr>
              </thead>
              <tbody>
                {payslips.map((p) => (
                  <tr key={p.id}>
                    <td className="font-medium">
                      {p.staff.lastName}, {p.staff.firstName}
                    </td>
                    <td className="tabular-nums text-sm">{p.month}</td>
                    <td className="tabular-nums">{formatNaira(p.gross)}</td>
                    <td className="tabular-nums text-brick">{formatNaira(p.deductions)}</td>
                    <td className="tabular-nums font-medium text-sage">{formatNaira(p.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </PortalShell>
  );
}

const TONE: Record<string, string> = {
  navy: "from-[#1a3a6e]/[12%] to-white border-navy/15",
  sage: "from-emerald-500/[12%] to-white border-emerald-500/20",
  gold: "from-amber-500/[12%] to-white border-amber-500/25",
};

function Kpi({ label, value, tone }: { label: string; value: string; tone: keyof typeof TONE }) {
  return (
    <div className={`rounded-xl border bg-gradient-to-br px-3.5 py-3 shadow-sm ${TONE[tone]}`}>
      <p className="text-[10px] font-medium uppercase tracking-wide text-ink/50">{label}</p>
      <p className="mt-1 text-base sm:text-xl font-semibold text-ink tabular-nums truncate" title={value}>
        {value}
      </p>
    </div>
  );
}
