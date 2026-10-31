import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { PortalShell } from "@/components/PortalShell";
import { can, homeRouteForRole } from "@/lib/permissions";
import { formatNaira, formatDate } from "@/lib/format";
import { toMoney } from "@/lib/money";
import { resolveSchoolId, schoolWhere } from "@/lib/tenant-scope";
import { redirect } from "next/navigation";
import { ExpenseForm } from "./ExpenseForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { Kpi } from "@/components/ui/Kpi";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const session = await requireSession();
  if (!can(session.role, "MANAGE_EXPENSES")) redirect(homeRouteForRole(session.role));

  const schoolId = await resolveSchoolId(session);
  const sw = schoolWhere(schoolId);

  const [expenses, incomeAgg, expenseAgg] = await Promise.all([
    prisma.expenseRecord.findMany({
      where: sw,
      orderBy: { date: "desc" },
      take: 100,
    }),
    prisma.payment.aggregate({
      where: {
        status: "SUCCESS",
        ...(schoolId ? { student: { schoolId } } : {}),
      },
      _sum: { amount: true },
    }),
    prisma.expenseRecord.aggregate({
      where: sw,
      _sum: { amount: true },
    }),
  ]);

  const income = toMoney(incomeAgg._sum.amount);
  const expenseTotal = toMoney(expenseAgg._sum.amount);
  const net = toMoney(income - expenseTotal);

  return (
    <PortalShell
      role={session.role}
      title="Expenses"
      subtitle="School spending and simple P&L"
      email={session.email}
      actions={
        <Link href="/fees" className="btn-ghost text-sm">
          ← Fees
        </Link>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <Kpi label="Fee income (recorded)" value={formatNaira(income)} tone="sage" icon="₦" />
        <Kpi label="Total expenses" value={formatNaira(expenseTotal)} tone="rose" icon="↓" />
        <Kpi
          label="Net (income − expenses)"
          value={formatNaira(net)}
          tone={net >= 0 ? "sky" : "rose"}
          icon={net >= 0 ? "✓" : "!"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <section className="rounded-xl border border-sky-200/80 bg-gradient-to-br from-sky-50 to-white p-4 sm:p-5 shadow-sm">
          <h2 className="font-serif text-lg text-navy mb-3">Record expense</h2>
          <ExpenseForm />
        </section>
        <section className="rounded-xl border border-line bg-white shadow-sm overflow-hidden lg:col-span-2">
          <div className="p-4 pb-2">
            <h2 className="font-serif text-lg text-navy">Recent expenses</h2>
          </div>
          {expenses.length === 0 ? (
            <EmptyState title="No expenses yet" description="Record utilities, supplies, and other school costs." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-ink/45 border-b border-line/80">
                    <th className="px-4 py-2 font-medium">Date</th>
                    <th className="px-4 py-2 font-medium">Category</th>
                    <th className="px-4 py-2 font-medium">Description</th>
                    <th className="px-4 py-2 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e) => (
                    <tr key={e.id} className="border-b border-line/60 last:border-0">
                      <td className="px-4 py-2.5 tabular-nums whitespace-nowrap">{formatDate(e.date)}</td>
                      <td className="px-4 py-2.5">{e.category}</td>
                      <td className="px-4 py-2.5 text-ink/70">{e.description || "—"}</td>
                      <td className="px-4 py-2.5 tabular-nums font-medium">{formatNaira(e.amount)}</td>
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
