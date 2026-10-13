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
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="rounded-xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50 to-white px-3.5 py-3 shadow-sm">
          <p className="text-[10px] uppercase tracking-wide font-medium text-emerald-700/70">
            Fee income (recorded)
          </p>
          <p className="mt-1.5 text-xl sm:text-2xl font-semibold tabular-nums text-emerald-800">
            {formatNaira(income)}
          </p>
        </div>
        <div className="rounded-xl border border-rose-200/90 bg-gradient-to-br from-rose-50 to-white px-3.5 py-3 shadow-sm">
          <p className="text-[10px] uppercase tracking-wide font-medium text-rose-700/70">
            Total expenses
          </p>
          <p className="mt-1.5 text-xl sm:text-2xl font-semibold tabular-nums text-rose-800">
            {formatNaira(expenseTotal)}
          </p>
        </div>
        <div
          className={`rounded-xl border px-3.5 py-3 shadow-sm bg-gradient-to-br to-white ${
            net >= 0 ? "border-sky-200/90 from-sky-50" : "border-rose-200/90 from-rose-50"
          }`}
        >
          <p
            className={`text-[10px] uppercase tracking-wide font-medium ${
              net >= 0 ? "text-sky-700/70" : "text-rose-700/70"
            }`}
          >
            Net (income − expenses)
          </p>
          <p
            className={`mt-1.5 text-xl sm:text-2xl font-semibold tabular-nums ${
              net >= 0 ? "text-sky-900" : "text-rose-800"
            }`}
          >
            {formatNaira(net)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <section className="ledger-block lg:col-span-1">
          <h2 className="font-serif text-lg text-navy mb-3">Record expense</h2>
          <ExpenseForm />
        </section>

        <section className="lg:col-span-2">
          {expenses.length === 0 ? (
            <EmptyState
              title="No expenses recorded yet"
              description="Log utilities, salaries, supplies and other school costs here."
            />
          ) : (
            <>
              <div className="md:hidden space-y-2">
                {expenses.map((e) => (
                  <div key={e.id} className="ledger-block !p-3">
                    <div className="flex justify-between gap-2">
                      <span className="status-pill text-[10px]">{e.category}</span>
                      <span className="text-xs text-ink/50">{formatDate(e.date)}</span>
                    </div>
                    <p className="text-sm text-ink mt-1.5">{e.description}</p>
                    <p className="text-base font-semibold tabular-nums text-rose-800 mt-1">
                      {formatNaira(e.amount)}
                    </p>
                  </div>
                ))}
              </div>

              <section className="hidden md:block ledger-block !p-0 overflow-x-auto">
                <div className="p-4 pb-0">
                  <h2 className="font-serif text-lg text-navy">Recent expenses</h2>
                </div>
                <table className="ledger mt-3">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((e) => (
                      <tr key={e.id}>
                        <td className="text-xs whitespace-nowrap">{formatDate(e.date)}</td>
                        <td>
                          <span className="status-pill text-[10px]">{e.category}</span>
                        </td>
                        <td>{e.description}</td>
                        <td className="tabular-nums text-rose-800 font-medium">
                          {formatNaira(e.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            </>
          )}
        </section>
      </div>
    </PortalShell>
  );
}
