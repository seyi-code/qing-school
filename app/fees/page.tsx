import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { PortalShell } from "@/components/PortalShell";
import { formatNaira } from "@/lib/format";
import { toMoney } from "@/lib/money";
import { CollectPaymentForm } from "./CollectPaymentForm";
import { VoidInvoiceButton } from "./VoidInvoiceButton";
import { FeeReminderButton } from "./FeeReminderButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { redirect } from "next/navigation";
import { homeRouteForRole } from "@/lib/permissions";
import Link from "next/link";
import { resolveSchoolId } from "@/lib/tenant-scope";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["ADMIN", "ACCOUNTANT", "SECRETARY", "PLATFORM_ADMIN", "IT"];

export default async function FeesPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string };
}) {
  const session = await requireSession();
  if (!ALLOWED_ROLES.includes(session.role)) redirect(homeRouteForRole(session.role));

  const schoolId = await resolveSchoolId(session);
  const invWhere = schoolId ? { student: { schoolId } } : {};
  const q = searchParams.q?.trim();
  const statusFilter = searchParams.status || "ALL";

  const [invoices, totalCollected, allInvoices] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        ...invWhere,
        ...(statusFilter !== "ALL"
          ? { status: statusFilter }
          : { NOT: { status: "VOIDED" } }),
        ...(q
          ? {
              student: {
                ...(schoolId ? { schoolId } : {}),
                OR: [
                  { firstName: { contains: q } },
                  { lastName: { contains: q } },
                  { admissionNumber: { contains: q } },
                ],
              },
            }
          : {}),
      },
      include: { student: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.invoice.aggregate({
      where: invWhere,
      _sum: { amountPaid: true },
    }),
    prisma.invoice.findMany({ where: invWhere }),
  ]);

  const liveInvoices = allInvoices.filter((i) => i.status !== "VOIDED");
  const outstanding = liveInvoices.reduce(
    (s, i) => s + (toMoney(i.totalAmount) - toMoney(i.amountPaid)),
    0
  );
  const debtors = liveInvoices.filter((i) => i.status !== "PAID");

  const tabs = [
    { key: "ALL", label: "All" },
    { key: "UNPAID", label: "Unpaid" },
    { key: "PARTIAL", label: "Partial" },
    { key: "PAID", label: "Paid" },
  ];

  return (
    <PortalShell
      role={session.role}
      title="Fees & Accounts"
      subtitle="Invoices, payments and debtors"
      email={session.email}
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href="/fees/structure" className="btn-ghost">
            Fee structure
          </Link>
          <Link href="/expenses" className="btn-ghost">
            Expenses
          </Link>
          <FeeReminderButton />
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="rounded-xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50 to-white px-3.5 py-3 shadow-sm">
          <p className="text-[10px] uppercase tracking-wide font-medium text-emerald-700/70">
            Total collected
          </p>
          <p className="mt-1.5 text-xl sm:text-2xl font-semibold tabular-nums text-emerald-800">
            {formatNaira(totalCollected._sum.amountPaid ?? 0)}
          </p>
        </div>
        <div className="rounded-xl border border-rose-200/90 bg-gradient-to-br from-rose-50 to-white px-3.5 py-3 shadow-sm">
          <p className="text-[10px] uppercase tracking-wide font-medium text-rose-700/70">
            Total outstanding
          </p>
          <p className="mt-1.5 text-xl sm:text-2xl font-semibold tabular-nums text-rose-800">
            {formatNaira(outstanding)}
          </p>
        </div>
        <div className="rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50 to-white px-3.5 py-3 shadow-sm">
          <p className="text-[10px] uppercase tracking-wide font-medium text-amber-800/70">
            Students owing
          </p>
          <p className="mt-1.5 text-xl sm:text-2xl font-semibold tabular-nums text-amber-900">
            {debtors.length}
          </p>
        </div>
      </div>

      <div className="tab-bar mb-3">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={`/fees?status=${tab.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
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
          placeholder="Search student or admission no."
          className="border border-line px-3 py-2 text-sm flex-1 min-w-[12rem] rounded-lg bg-white"
        />
        <button type="submit" className="btn-ghost">
          Search
        </button>
      </form>

      {invoices.length === 0 ? (
        <EmptyState
          title="No invoices in this list"
          description="Generate invoices from fee structure, or clear filters."
          action={
            <Link href="/fees/structure" className="btn-primary">
              Fee structure
            </Link>
          }
        />
      ) : (
        <>
          <div className="md:hidden space-y-2 mb-4">
            {invoices.map((inv) => {
              const bal = toMoney(inv.totalAmount) - toMoney(inv.amountPaid);
              return (
                <div key={inv.id} className="ledger-block !p-3 space-y-2">
                  <div className="flex justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">
                        {inv.student.lastName}, {inv.student.firstName}
                      </p>
                      <p className="text-xs font-mono text-ink/50">
                        {inv.student.admissionNumber}
                      </p>
                    </div>
                    <span
                      className={`status-pill text-[10px] h-fit ${
                        inv.status === "PAID"
                          ? "text-sage"
                          : inv.status === "PARTIAL"
                            ? "text-gold-dark"
                            : "text-brick"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-xs">
                    <div>
                      <p className="text-ink/45">Total</p>
                      <p className="font-medium tabular-nums">{formatNaira(inv.totalAmount)}</p>
                    </div>
                    <div>
                      <p className="text-ink/45">Paid</p>
                      <p className="font-medium tabular-nums text-sage">
                        {formatNaira(inv.amountPaid)}
                      </p>
                    </div>
                    <div>
                      <p className="text-ink/45">Balance</p>
                      <p className={`font-medium tabular-nums ${bal > 0 ? "text-brick" : ""}`}>
                        {formatNaira(bal)}
                      </p>
                    </div>
                  </div>
                  {inv.status !== "PAID" && inv.status !== "VOIDED" && (
                    <div className="flex flex-wrap items-center gap-3">
                      <CollectPaymentForm invoiceId={inv.id} maxAmount={bal} />
                      {toMoney(inv.amountPaid) === 0 && <VoidInvoiceButton invoiceId={inv.id} />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <section className="hidden md:block ledger-block !p-0 overflow-x-auto">
            <div className="p-4 pb-0">
              <h2 className="font-serif text-lg text-navy">Recent invoices</h2>
            </div>
            <table className="ledger mt-3">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Collect</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const bal = toMoney(inv.totalAmount) - toMoney(inv.amountPaid);
                  return (
                    <tr key={inv.id}>
                      <td>
                        {inv.student.lastName}, {inv.student.firstName}
                        <div className="text-xs text-ink/50 font-mono">
                          {inv.student.admissionNumber}
                        </div>
                      </td>
                      <td className="tabular-nums">{formatNaira(inv.totalAmount)}</td>
                      <td className="tabular-nums">{formatNaira(inv.amountPaid)}</td>
                      <td className={`tabular-nums ${bal > 0 ? "text-brick" : ""}`}>
                        {formatNaira(bal)}
                      </td>
                      <td>
                        <span
                          className={`status-pill ${
                            inv.status === "PAID"
                              ? "text-sage"
                              : inv.status === "PARTIAL"
                                ? "text-gold-dark"
                                : "text-brick"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td>
                        {inv.status !== "PAID" && inv.status !== "VOIDED" && (
                          <div className="flex flex-col gap-1 items-start">
                            <CollectPaymentForm invoiceId={inv.id} maxAmount={bal} />
                            {toMoney(inv.amountPaid) === 0 && (
                              <VoidInvoiceButton invoiceId={inv.id} />
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        </>
      )}
    </PortalShell>
  );
}
