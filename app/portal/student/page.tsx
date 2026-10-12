import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { PortalShell } from "@/components/PortalShell";
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
      arm: { include: { schoolClass: true } },
      invoices: { orderBy: { createdAt: "desc" } },
      scores: {
        include: { armSubject: { include: { subject: true } } },
        orderBy: { createdAt: "desc" },
        take: 8,
      },
      attendances: { orderBy: { date: "desc" }, take: 8 },
    },
  });

  if (!student) {
    return (
      <PortalShell role={session.role} title="My Portal" email={session.email}>
        <div className="rounded-xl border border-line bg-white p-5 text-sm text-ink/70">
          Your login isn&apos;t linked to a student profile yet. Ask the school office to enable
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

  return (
    <PortalShell
      role={session.role}
      title={`Hi, ${student.firstName}`}
      subtitle={`${classLabel} · ${student.admissionNumber}`}
      email={session.email}
    >
      {/* KPI strip — tight mobile grid */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-4 sm:mb-5">
        <Kpi
          label="Fee balance"
          value={formatNaira(balance)}
          valueClass={balance > 0 ? "text-brick" : "text-sage"}
        />
        <Kpi label="Subjects scored" value={String(student.scores.length)} />
        <Kpi
          label="Admission no."
          value={student.admissionNumber}
          className="col-span-2"
          mono
        />
      </div>

      {/* Quick actions — button style, not bare links */}
      <div className="flex flex-wrap gap-2 mb-4 sm:mb-5">
        <Action href={`/students/${student.id}`} label="My record" />
        <Action href={`/students/${student.id}/report-card`} label="Report card" primary />
        {unpaid.length > 0 && (
          <span className="text-xs self-center text-brick font-medium">
            {unpaid.length} unpaid invoice{unpaid.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {unpaid.length > 0 && (
        <section className="rounded-xl border border-line bg-white p-4 sm:p-5 mb-4 sm:mb-5">
          <h2 className="text-sm font-semibold text-ink mb-3">Pay fees</h2>
          <ul className="space-y-3">
            {unpaid.map((inv) => {
              const bal = toMoney(inv.totalAmount) - toMoney(inv.amountPaid);
              return (
                <li
                  key={inv.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm border-b border-line/80 pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">{formatNaira(bal)} due</p>
                    <p className="text-xs text-ink/50">
                      Total {formatNaira(inv.totalAmount)} · Paid {formatNaira(inv.amountPaid)} ·{" "}
                      {inv.status}
                    </p>
                  </div>
                  <PayOnlineButton invoiceId={inv.id} amount={bal} />
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <section className="rounded-xl border border-line bg-white p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-ink">Recent scores</h2>
          </div>
          {student.scores.length === 0 ? (
            <Empty text="No scores yet." />
          ) : (
            <ul className="divide-y divide-line/80">
              {student.scores.map((s) => (
                <li key={s.id} className="flex justify-between py-2 text-sm">
                  <span className="text-ink/80 truncate pr-2">{s.armSubject.subject.name}</span>
                  <span className="font-semibold tabular-nums">{s.total}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-line bg-white p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-ink">Recent attendance</h2>
          </div>
          {student.attendances.length === 0 ? (
            <Empty text="No attendance recorded yet." />
          ) : (
            <ul className="divide-y divide-line/80">
              {student.attendances.map((a) => (
                <li key={a.id} className="flex justify-between items-center py-2 text-sm">
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

function Kpi({
  label,
  value,
  valueClass = "text-ink",
  className = "",
  mono = false,
}: {
  label: string;
  value: string;
  valueClass?: string;
  className?: string;
  mono?: boolean;
}) {
  return (
    <div className={`rounded-xl border border-line bg-white px-3.5 py-3 sm:px-4 sm:py-3.5 ${className}`}>
      <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-ink/45">
        {label}
      </p>
      <p
        className={`mt-1 text-lg sm:text-xl font-semibold tracking-tight ${valueClass} ${
          mono ? "font-mono text-base sm:text-lg" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Action({
  href,
  label,
  primary = false,
}: {
  href: string;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        primary
          ? "inline-flex items-center rounded-lg bg-navy px-3.5 py-2 text-xs font-medium text-paper hover:bg-navy-light"
          : "inline-flex items-center rounded-lg border border-line bg-white px-3.5 py-2 text-xs font-medium text-ink hover:border-navy/40"
      }
    >
      {label}
    </Link>
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
    <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md border ${tone}`}>
      {status}
    </span>
  );
}
