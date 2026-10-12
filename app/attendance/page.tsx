import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { PortalShell } from "@/components/PortalShell";
import { AttendanceForm } from "./AttendanceForm";
import { ArmPicker } from "./ArmPicker";
import { redirect } from "next/navigation";
import { homeRouteForRole } from "@/lib/permissions";
import { resolveSchoolId } from "@/lib/tenant-scope";
import Link from "next/link";

const ALLOWED_ROLES = ["PLATFORM_ADMIN", "ADMIN", "TEACHER", "IT"];

export const dynamic = "force-dynamic";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: { armId?: string };
}) {
  const session = await requireSession();
  if (!ALLOWED_ROLES.includes(session.role)) redirect(homeRouteForRole(session.role));

  const schoolId = await resolveSchoolId(session);

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

  const todayIso = new Date().toISOString().slice(0, 10);
  const todaysMarks = selectedArmId
    ? await prisma.attendance.findMany({
        where: {
          date: new Date(todayIso),
          student: {
            armId: selectedArmId,
            ...(schoolId ? { schoolId } : {}),
          },
        },
      })
    : [];
  const marksByStudent = Object.fromEntries(todaysMarks.map((m) => [m.studentId, m.status]));
  const selectedArm = arms.find((a) => a.id === selectedArmId);
  const presentCount = todaysMarks.filter((m) => m.status === "PRESENT").length;
  const absentCount = todaysMarks.filter((m) => m.status === "ABSENT").length;
  const lateCount = todaysMarks.filter((m) => m.status === "LATE").length;
  const markedCount = todaysMarks.length;
  const classSize = students.length;
  const presentRate =
    markedCount > 0 ? Math.round((presentCount / markedCount) * 100) : null;

  return (
    <PortalShell
      role={session.role}
      title="Attendance"
      subtitle={
        selectedArm
          ? `Mark today · ${selectedArm.schoolClass.name} ${selectedArm.name}`
          : "Mark today's attendance for a class"
      }
      email={session.email}
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="ledger-block !p-3">
          <p className="text-[10px] uppercase tracking-wide text-ink/50">In class</p>
          <p className="ledger-number text-xl text-navy mt-0.5">{classSize}</p>
        </div>
        <div className="ledger-block !p-3">
          <p className="text-[10px] uppercase tracking-wide text-ink/50">Present today</p>
          <p className="ledger-number text-xl text-sage mt-0.5">{presentCount}</p>
        </div>
        <div className="ledger-block !p-3">
          <p className="text-[10px] uppercase tracking-wide text-ink/50">Absent / late</p>
          <p className="ledger-number text-xl text-brick mt-0.5">
            {absentCount}
            {lateCount ? ` / ${lateCount}L` : ""}
          </p>
        </div>
        <div className="ledger-block !p-3">
          <p className="text-[10px] uppercase tracking-wide text-ink/50">Marked</p>
          <p className="ledger-number text-xl text-navy mt-0.5">
            {markedCount}
            {presentRate != null ? (
              <span className="text-sm font-sans text-ink/50 ml-1">{presentRate}%</span>
            ) : null}
          </p>
        </div>
      </div>

      <ArmPicker
        arms={arms.map((a) => ({
          id: a.id,
          label: `${a.schoolClass.name} ${a.name} (${a._count.students})`,
        }))}
        selectedArmId={selectedArmId}
      />

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
            or admit new students into this arm.
          </p>
        </div>
      ) : selectedArmId ? (
        <div className="mt-3">
          <AttendanceForm
            armId={selectedArmId}
            date={todayIso}
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
