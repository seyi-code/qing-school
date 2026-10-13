import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { PortalShell } from "@/components/PortalShell";
import { homeRouteForRole } from "@/lib/permissions";
import { formatNaira } from "@/lib/format";
import { toMoney } from "@/lib/money";
import { resolveSchoolId, schoolWhere } from "@/lib/tenant-scope";
import { redirect } from "next/navigation";
import { TransportClient } from "./TransportClient";

export const dynamic = "force-dynamic";

const ALLOWED = ["ADMIN", "IT", "SECRETARY", "PRINCIPAL", "ACCOUNTANT", "PLATFORM_ADMIN"];

export default async function TransportPage() {
  const session = await requireSession();
  if (!ALLOWED.includes(session.role)) {
    redirect(homeRouteForRole(session.role));
  }

  const schoolId = await resolveSchoolId(session);

  const [routes, students] = await Promise.all([
    prisma.transportRoute.findMany({
      where: schoolWhere(schoolId),
      include: {
        enrollments: {
          where: { status: "ACTIVE" },
          include: {
            student: {
              select: { id: true, firstName: true, lastName: true, admissionNumber: true },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.student.findMany({
      where: { status: "ACTIVE", ...schoolWhere(schoolId) },
      select: { id: true, firstName: true, lastName: true, admissionNumber: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      take: 500,
    }),
  ]);

  const riders = routes.reduce((s, r) => s + r.enrollments.length, 0);
  const feeSum = routes.reduce((s, r) => s + toMoney(r.feeAmount), 0);

  return (
    <PortalShell
      role={session.role}
      title="Transport"
      subtitle="Bus routes, drivers, and riders"
      email={session.email}
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-4 sm:mb-5">
        <Kpi label="Routes" value={String(routes.length)} tone="navy" />
        <Kpi label="Riders" value={String(riders)} tone="sky" />
        <Kpi label="Route fees" value={formatNaira(feeSum)} tone="gold" />
        <Kpi label="Students list" value={String(students.length)} tone="sage" />
      </div>
      <TransportClient
        routes={routes.map((r) => ({
          id: r.id,
          name: r.name,
          vehicle: r.vehicle,
          driverName: r.driverName,
          driverPhone: r.driverPhone,
          feeAmount: toMoney(r.feeAmount),
          feeLabel: formatNaira(r.feeAmount),
          riders: r.enrollments.map((e) => ({
            id: e.id,
            studentName: `${e.student.firstName} ${e.student.lastName}`,
            admissionNumber: e.student.admissionNumber,
          })),
        }))}
        students={students.map((s) => ({
          id: s.id,
          label: `${s.lastName}, ${s.firstName} (${s.admissionNumber})`,
        }))}
      />
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
      <p className="mt-1 text-base sm:text-xl font-semibold text-ink tabular-nums truncate" title={value}>
        {value}
      </p>
    </div>
  );
}
