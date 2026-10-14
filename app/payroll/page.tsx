import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { PortalShell } from "@/components/PortalShell";
import { formatNaira } from "@/lib/format";
import { can } from "@/lib/permissions";
import { resolveSchoolId } from "@/lib/tenant-scope";
import { toMoney } from "@/lib/money";
import { redirect } from "next/navigation";
import { PayrollRunner } from "./PayrollRunner";
import { Kpi } from "@/components/ui/Kpi";

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
        <Kpi label="Payslips" value={String(payslips.length)} tone="navy" icon="📄" />
        <Kpi label="Gross (listed)" value={formatNaira(grossSum)} tone="gold" icon="₦" />
        <Kpi label="Net (listed)" value={formatNaira(netSum)} tone="sage" icon="✓" />
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
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink/45 border-b border-line/80">
                  <th className="px-4 py-2 font-medium">Staff</th>
                  <th className="px-4 py-2 font-medium">Month</th>
                  <th className="px-4 py-2 font-medium">Gross</th>
                  <th className="px-4 py-2 font-medium">Deduction</th>
                  <th className="px-4 py-2 font-medium">Net</th>
                </tr>
              </thead>
              <tbody>
                {payslips.map((p) => (
                  <tr key={p.id} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-2.5">
                      {p.staff.lastName}, {p.staff.firstName}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums">{p.month}</td>
                    <td className="px-4 py-2.5 tabular-nums">{formatNaira(p.gross)}</td>
                    <td className="px-4 py-2.5 tabular-nums text-brick">{formatNaira(p.deductions)}</td>
                    <td className="px-4 py-2.5 tabular-nums font-medium text-sage">{formatNaira(p.net)}</td>
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
