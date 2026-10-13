import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { PortalShell } from "@/components/PortalShell";
import { homeRouteForRole, can } from "@/lib/permissions";
import { toMoney } from "@/lib/money";
import { resolveSchoolId } from "@/lib/tenant-scope";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FeeStructureClient } from "./FeeStructureClient";

export const dynamic = "force-dynamic";

export default async function FeeStructurePage() {
  const session = await requireSession();
  if (!can(session.role, "MANAGE_FEES") && session.role !== "SECRETARY") {
    redirect(homeRouteForRole(session.role));
  }

  const schoolId = await resolveSchoolId(session);

  const [arms, terms, items] = await Promise.all([
    prisma.arm.findMany({
      where: schoolId ? { schoolClass: { schoolId } } : undefined,
      include: { schoolClass: true },
      orderBy: [{ schoolClass: { order: "asc" } }, { name: "asc" }],
    }),
    prisma.term.findMany({
      where: schoolId ? { session: { schoolId } } : undefined,
      orderBy: { startDate: "desc" },
    }),
    prisma.feeItem.findMany({
      where: schoolId ? { arm: { schoolClass: { schoolId } } } : undefined,
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const totalCatalogue = items.reduce((s, i) => s + toMoney(i.amount), 0);
  const compulsory = items.filter((i) => i.compulsory).length;

  return (
    <PortalShell
      role={session.role}
      title="Fee structure"
      subtitle="Define class/term fees and generate student invoices"
      email={session.email}
      actions={
        <Link href="/fees" className="btn-ghost text-sm">
          Back to Fees
        </Link>
      }
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-4 sm:mb-5">
        <Kpi label="Arms" value={String(arms.length)} tone="navy" />
        <Kpi label="Terms" value={String(terms.length)} tone="sky" />
        <Kpi label="Fee items" value={String(items.length)} tone="gold" />
        <Kpi label="Compulsory" value={String(compulsory)} tone="sage" />
      </div>
      {arms.length === 0 ? (
        <p className="text-sm text-ink/50 rounded-xl border border-line bg-white px-4 py-6 text-center">
          Create classes and arms first under Classes.
        </p>
      ) : (
        <FeeStructureClient
          arms={arms.map((a) => ({
            id: a.id,
            label: `${a.schoolClass.name} ${a.name}`,
          }))}
          terms={terms.map((t) => ({
            id: t.id,
            name: t.name,
            isCurrent: t.isCurrent,
          }))}
          items={items.map((i) => ({
            id: i.id,
            name: i.name,
            amount: toMoney(i.amount),
            compulsory: i.compulsory,
            armId: i.armId,
            termId: i.termId,
          }))}
        />
      )}
      {items.length > 0 && (
        <p className="text-xs text-ink/45 mt-3">
          Catalogue total across all arms/terms:{" "}
          <span className="font-semibold text-navy tabular-nums">
            ₦{totalCatalogue.toLocaleString()}
          </span>
        </p>
      )}
    </PortalShell>
  );
}

const TONE: Record<string, string> = {
  navy: "from-[#1a3a6e]/[12%] to-white border-navy/15",
  sky: "from-sky-500/[12%] to-white border-sky-500/20",
  sage: "from-emerald-500/[12%] to-white border-emerald-500/20",
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
