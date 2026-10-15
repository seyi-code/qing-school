import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { PortalShell } from "@/components/PortalShell";
import { ActionTile } from "@/components/ui/ActionTile";
import { PayOnlineButton } from "@/components/PayOnlineButton";
import { formatNaira, formatDate } from "@/lib/format";
import { toMoney } from "@/lib/money";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function StudentPortalPage() {
  const session = await requireSession();
  if (session.role !== "STUDENT") redirect("/dashboard");

  const student = await prisma.student.findUnique({
    where: { userId: session.userId },
    include: {
      school: { select: { name: true, shortName: true } },
      arm: { include: { schoolClass: true } },
      invoices: { orderBy: { createdAt: "desc" } },
      scores: {
        include: { armSubject: { include: { subject: true } } },
        take: 8,
        orderBy: { createdAt: "desc" },
      },
      attendances: { orderBy: { date: "desc" }, take: 10 },
    },
  });

  if (!student) {
    return (
      <PortalShell role={session.role} title="My Portal" email={session.email}>
        <div className="rounded-xl border border-line bg-white p-5 text-sm text-ink/70">
          Your login isn't linked to a student profile yet. Ask the school office to enable
          portal access on your student record.
        </div>
      </PortalShell>
    );
  }

  const balance = student.invoices.reduce(
    (s, i) => s + (toMoney(i.totalAmount) - toMoney(i.amountPaid)),
    0
  );
  const unpaid = student.invoices.filter((i) => i.status !== "PAID");
  const classLabel = student.arm
    ? `${student.arm.schoolClass.name} ${student.arm.name}`
    : "Class unassigned";
  const schoolName = student.school?.name || "";
  const schoolShort = student.school?.shortName || "";

  return (
    <PortalShell
      role={session.role}
      title={`Hi, ${student.firstName}`}
      subtitle={`${classLabel} · ${student.admissionNumber}`}
      email={session.email}
      schoolName={schoolName}
      schoolShortName={schoolShort}
    >
      <div className="grid grid-cols-2 gap-3 mb-4 sm:mb-5">
        <Kpi label="Fee balance" value={formatNaira(balance)} tone={balance > 0 ? "rose" : "sage"} />
        <Kpi label="Admission no." value={student.admissionNumber} tone="navy" mono />
      </div>

      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#627184] mb-2">
        Quick actions
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 sm:mb-5">
        <ActionTile
          href={`/students/${student.id}`}
          label="My record"
          icon="👤"
          description="Profile and class details"
        />
        <ActionTile
          href={`/students/${student.id}/report-card`}
          label="Report card"
          icon="📊"
          description="Term results"
          primary
        />
        <ActionTile href="/cbt" label="CBT / Tests" icon="💻" description="Open computer-based exams" />
        <ActionTile
          href="/fees"
          label="Fees"
          icon="₦"
          description={unpaid.length ? `${unpaid.length} unpaid` : "Balances"}
        />
      </div>

      {unpaid.length > 0 && (
        <section className="rounded-xl border border-line/80 bg-white p-4 sm:p-5 mb-4 sm:mb-5 shadow-sm">
          <h2 className="text-sm font-semibold text-navy mb-3">Pay fees</h2>
          <ul className="space-y-3">
            {unpaid.map((inv) => {
              const bal = toMoney(inv.totalAmount) - toMoney(inv.amountPaid);
              return (
                <li
                  key={inv.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">{inv.description || "School fees"}</p>
                    <p className="text-xs text-ink/50">{inv.status}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold tabular-nums">{formatNaira(bal)}</span>
                    <PayOnlineButton invoiceId={inv.id} maxAmount={bal} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="rounded-xl border border-line/80 bg-white p-4 sm:p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-navy mb-3">Recent scores</h2>
          {student.scores.length === 0 ? (
            <Empty text="No scores yet" />
          ) : (
            <ul className="text-sm space-y-2">
              {student.scores.map((sc) => (
                <li key={sc.id} className="flex justify-between border-b border-line pb-2">
                  <span>{sc.armSubject.subject.name}</span>
                  <span className="font-mono text-xs">{sc.total ?? "—"}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-xl border border-line/80 bg-white p-4 sm:p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-navy mb-3">Recent attendance</h2>
          {student.attendances.length === 0 ? (
            <Empty text="No attendance yet" />
          ) : (
            <ul className="text-sm space-y-2">
              {student.attendances.map((a) => (
                <li key={a.id} className="flex justify-between border-b border-line pb-2">
                  <span className="text-ink/70">{formatDate(a.date)}</span>
                  <Status status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PortalShell>
  );
}

const TONE: Record<string, string> = {
  navy: "from-[#1a3a6e]/[12%] to-white border-navy/15",
  sky: "from-sky-500/[12%] to-white border-sky-500/20",
  sage: "from-emerald-500/[12%] to-white border-emerald-500/20",
  rose: "from-rose-500/[12%] to-white border-rose-500/20",
  gold: "from-amber-500/[12%] to-white border-amber-500/25",
};

function Kpi({
  label,
  value,
  tone = "navy",
  mono = false,
  className = "",
}: {
  label: string;
  value: string;
  tone?: keyof typeof TONE;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border bg-gradient-to-br px-3.5 py-3 sm:px-4 sm:py-3.5 min-w-0 ${TONE[tone] || TONE.navy} ${className}`}
    >
      <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-ink/50">{label}</p>
      <p
        className={`mt-1 font-semibold tracking-tight text-ink truncate ${
          mono ? "font-mono text-xs sm:text-sm" : "text-lg sm:text-xl"
        }`}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-ink/40 py-6 text-center">{text}</p>;
}

function Status({ status }: { status: string }) {
  const tone =
    status === "PRESENT" || status === "PAID"
      ? "bg-sage/15 text-sage border-sage/30"
      : status === "LATE" || status === "PARTIAL"
        ? "bg-gold/15 text-gold-dark border-gold/30"
        : status === "ABSENT" || status === "UNPAID"
          ? "bg-brick/10 text-brick border-brick/25"
          : "bg-ink/5 text-ink/60 border-line";
  return (
    <span
      className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md border ${tone}`}
    >
      {status}
    </span>
  );
}
