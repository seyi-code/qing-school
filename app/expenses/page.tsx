import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { PortalShell } from "@/components/PortalShell";
import { can, homeRouteForRole } from "@/lib/permissions";
import { formatNaira } from "@/lib/format";
import { toMoney } from "@/lib/money";
import { resolveSchoolId, schoolWhere } from "@/lib/tenant-scope";
import { redirect } from "next/navigation";
import { ExpensesBoard } from "./ExpensesBoard";
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
      take: 500,
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

      <ExpensesBoard
        expenses={expenses.map((e) => ({
          id: e.id,
          category: e.category,
          description: e.description,
          amount: Number(e.amount),
          date: e.date,
        }))}
      />
    </PortalShell>
  );
}
