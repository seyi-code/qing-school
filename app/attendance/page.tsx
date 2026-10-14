import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { PortalShell } from "@/components/PortalShell";
import { AttendanceForm } from "./AttendanceForm";
import { ArmPicker } from "./ArmPicker";
import { DateNav } from "./DateNav";
import { redirect } from "next/navigation";
import { homeRouteForRole } from "@/lib/permissions";
import { resolveSchoolId } from "@/lib/tenant-scope";
import { Kpi } from "@/components/ui/Kpi";
import Link from "next/link";

const ALLOWED_ROLES = ["PLATFORM_ADMIN", "ADMIN", "TEACHER", "IT"];

export const dynamic = "force-dynamic";

function isIsoDate(s: string | undefined): s is string {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: { armId?: string; date?: string };
}) {
  const session = await requireSession();
  if (!ALLOWED_ROLES.includes(session.role)) redirect(homeRouteForRole(session.role));

  const schoolId = await resolveSchoolId(session);
  const todayIso = new Date().toISOString().slice(0, 10);
  const dateIso =
    isIsoDate(searchParams.date) && searchParams.date <= todayIso
      ? searchParams.date
      : todayIso;

  const arms = await prisma.arm.findMany({
    where: schoolId ? { schoolClass: { schoolId } } : undefined,
    include: {
      schoolClass: true,
      _count: { select: { students: { where: { status: "ACTIVE" } } } },
    },
    orderBy: [{ schoolClass: { order: "asc" } }, { name: "asc" }],
  });

  const requested = searchParams.armId;
  const selectedArmId =
    (requested && arms.some((a) => a.id === requested) ? requested : null) ?? arms[0]?.id;

  const students = selectedArmId
    ? await prisma.student.findMany({
        where: {
          armId: selectedArmId,
          status: "ACTIVE",
          ...(schoolId ? { schoolId } : {}),
        },
        orderBy: [{ lastName: "asc" }],
      })
    : [];

  const dayMarks = selectedArmId
    ? await prisma.attendance.findMany({
        where: {
          date: new Date(dateIso),
          student: {
            armId: selectedArmId,
            ...(schoolId ? { schoolId } : {}),
          },
        },
      })
    : [];
  const marksByStudent = Object.fromEntries(dayMarks.map((m) => [m.studentId, m.status]));
  const selectedArm = arms.find((a) => a.id === selectedArmId);
  const presentCount = dayMarks.filter((m) => m.status === "PRESENT").length;
  const absentCount = dayMarks.filter((m) => m.status === "ABSENT").length;
  const lateCount = dayMarks.filter((m) => m.status === "LATE").length;
  const markedCount = dayMarks.length;
  const classSize = students.length;
  const presentRate =
    markedCount > 0 ? Math.round((presentCount / markedCount) * 100) : null;
  const alreadySaved = markedCount > 0;
  const isToday = dateIso === todayIso;

  // Recent history (14 days) for this arm — no schema change
  const from = new Date(todayIso);
  from.setDate(from.getDate() - 14);
  const recentRows = selectedArmId
    ? await prisma.attendance.findMany({
        where: {
          date: { gte: from },
          student: {
            armId: selectedArmId,
            ...(schoolId ? { schoolId } : {}),
          },
        },
        select: { date: true, status: true },
      })
    : [];

  const byDate = new Map<string, { marked: number; present: number }>();
  for (const r of recentRows) {
    const key = r.date.toISOString().slice(0, 10);
    const cur = byDate.get(key) ?? { marked: 0, present: 0 };
    cur.marked += 1;
    if (r.status === "PRESENT") cur.present += 1;
    byDate.set(key, cur);
  }
  const history = Array.from(byDate.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const dateLabel = new Date(dateIso + "T12:00:00").toLocaleDateString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <PortalShell
      role={session.role}
      title="Attendance"
      subtitle={
        selectedArm
          ? `${isToday ? "Mark" : "Register"} · ${selectedArm.schoolClass.name} ${selectedArm.name} · ${dateLabel}`
          : "Mark attendance for a class"
      }
      email={session.email}
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <Kpi label="In class" value={String(classSize)} tone="navy" icon="🏫" />
        <Kpi
          label={isToday ? "Present today" : "Present"}
          value={String(presentCount)}
          tone="sage"
          icon="✓"
        />
        <Kpi
          label="Absent / late"
          value={String(absentCount) + (lateCount ? ` / ${lateCount}L` : "")}
          tone="rose"
          icon="!"
        />
        <Kpi
          label="Marked"
          value={String(markedCount) + (presentRate != null ? ` · ${presentRate}%` : "")}
          tone="violet"
          icon="📋"
        />
      </div>

      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div>
          <p className="text-[11px] text-ink/45 mb-1 uppercase tracking-wide">Class</p>
          <ArmPicker
            arms={arms.map((a) => ({
              id: a.id,
              label: `${a.schoolClass.name} ${a.name} (${a._count.students})`,
            }))}
            selectedArmId={selectedArmId}
            date={dateIso}
          />
        </div>
        <div className="flex-1 min-w-[16rem]">
          <DateNav armId={selectedArmId} date={dateIso} history={history} />
        </div>
      </div>

      {arms.length === 0 ? (
        <div className="ledger-block text-sm text-ink/70 mt-3">
          <p>No classes/arms for this school yet. Create them under Classes first.</p>
        </div>
      ) : selectedArmId && students.length === 0 ? (
        <div className="ledger-block text-sm text-ink/70 space-y-2 mt-3">
          <p>
            <strong>
              {selectedArm
                ? `${selectedArm.schoolClass.name} ${selectedArm.name}`
                : "This class"}
            </strong>{" "}
            has <strong>0 active students</strong> assigned.
          </p>
          <p>
            Assign students under{" "}
            <Link href="/students" className="text-navy font-medium hover:underline">
              Students
            </Link>{" "}
            (edit student → class/arm), then return here to mark attendance.
          </p>
        </div>
      ) : selectedArmId ? (
        <div className="mt-3">
          <AttendanceForm
            armId={selectedArmId}
            date={dateIso}
            alreadySaved={alreadySaved}
            students={students.map((s) => ({
              id: s.id,
              name: `${s.lastName}, ${s.firstName}`,
              status: (marksByStudent[s.id] as "PRESENT" | "ABSENT" | "LATE") || "PRESENT",
            }))}
          />
        </div>
      ) : null}
    </PortalShell>
  );
}
