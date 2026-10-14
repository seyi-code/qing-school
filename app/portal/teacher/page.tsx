import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { PortalShell } from "@/components/PortalShell";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TeacherPortalPage() {
  const session = await requireSession();
  if (session.role !== "TEACHER") redirect("/dashboard");

  const staff = await prisma.staff.findUnique({
    where: { userId: session.userId },
    include: {
      classesLed: { include: { schoolClass: true, students: { where: { status: "ACTIVE" } } } },
      subjectsTaught: {
        include: { arm: { include: { schoolClass: true } }, subject: true },
      },
      leaveRequests: { orderBy: { createdAt: "desc" }, take: 3 },
    },
  });

  if (!staff) {
    return (
      <PortalShell role={session.role} title="Teacher Portal" email={session.email}>
        <p className="text-ink/60 text-sm rounded-xl border border-line bg-white px-4 py-6 text-center">
          Your login is not linked to a staff profile yet. Ask Admin/IT to create your staff record
          and link this email.
        </p>
      </PortalShell>
    );
  }

  const studentCount = staff.classesLed.reduce((n, a) => n + a.students.length, 0);

  return (
    <PortalShell
      role={session.role}
      title={`Welcome, ${staff.firstName}`}
      subtitle={staff.designation ?? "Teacher"}
      email={session.email}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/40 mb-3">
        Classroom command centre
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <Kpi label="Classes led" value={String(staff.classesLed.length)} tone="navy" icon="🏫" />
        <Kpi label="Subjects" value={String(staff.subjectsTaught.length)} tone="violet" icon="📚" />
        <Kpi
          label="Students in your classes"
          value={String(studentCount)}
          tone="sage"
          icon="🎓"
          wide
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <section className="rounded-xl border border-sky-200/80 bg-gradient-to-br from-sky-50 to-white p-4 sm:p-5 shadow-sm">
          <h2 className="font-serif text-lg text-navy mb-3">Classes you lead</h2>
          <ul className="text-sm space-y-2">
            {staff.classesLed.map((a) => (
              <li key={a.id} className="flex justify-between border-b border-line pb-2">
                <span>
                  {a.schoolClass.name} {a.name}
                </span>
                <span className="text-ink/50">{a.students.length} students</span>
              </li>
            ))}
            {staff.classesLed.length === 0 && (
              <li className="text-ink/50 text-sm">
                None assigned as class teacher yet. Admin: Classes → assign subject → check "Also set
                as class teacher".
              </li>
            )}
          </ul>
        </section>

        <section className="rounded-xl border border-violet-200/70 bg-gradient-to-br from-violet-50/50 to-white p-4 sm:p-5 shadow-sm">
          <h2 className="font-serif text-lg text-navy mb-3">Subjects you teach</h2>
          <ul className="text-sm space-y-2">
            {staff.subjectsTaught.map((as) => (
              <li key={as.id} className="border-b border-line pb-2">
                {as.subject.name}
                <span className="text-ink/50">
                  {" "}
                  — {as.arm.schoolClass.name} {as.arm.name}
                </span>
              </li>
            ))}
            {staff.subjectsTaught.length === 0 && (
              <li className="text-ink/50 text-sm">
                No subject assignments yet. Admin: Classes → Assign subject to arm → choose teacher.
              </li>
            )}
          </ul>
        </section>
      </div>

      <section className="rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/80 to-white p-4 sm:p-5 shadow-sm mb-6">
        <h2 className="font-serif text-lg text-navy mb-3">Quick actions</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/attendance" className="btn-primary text-sm">
            Take attendance
          </Link>
          <Link href="/exams" className="btn-ghost text-sm">
            Enter scores
          </Link>
          <Link href="/students" className="btn-ghost text-sm">
            Class list
          </Link>
          <Link href="/timetable" className="btn-ghost text-sm">
            Timetable
          </Link>
          <Link href="/leave" className="btn-ghost text-sm">
            Request leave
          </Link>
        </div>
      </section>

      {staff.leaveRequests.length > 0 && (
        <section className="rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 to-white p-4 sm:p-5 shadow-sm">
          <h2 className="font-serif text-lg text-navy mb-3">Recent leave requests</h2>
          <ul className="text-sm space-y-2">
            {staff.leaveRequests.map((r) => (
              <li key={r.id} className="flex justify-between gap-2 border-b border-line pb-2">
                <span className="text-ink/70">
                  {r.startDate.toLocaleDateString()} – {r.endDate.toLocaleDateString()}
                </span>
                <span className="status-pill text-xs">{r.status}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </PortalShell>
  );
}

const TONE: Record<string, string> = {
  navy: "from-[#1a3a6e]/[12%] to-white border-navy/15",
  violet: "from-violet-500/[12%] to-white border-violet-500/20",
  sage: "from-emerald-500/[12%] to-white border-emerald-500/20",
};

function Kpi({
  label,
  value,
  tone,
  icon,
  wide,
}: {
  label: string;
  value: string;
  tone: keyof typeof TONE;
  icon: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-gradient-to-br px-3.5 py-3 shadow-sm ${TONE[tone]} ${
        wide ? "col-span-2 sm:col-span-1" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-medium uppercase tracking-wide text-ink/50">{label}</p>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/80 text-sm shadow-sm">
          {icon}
        </span>
      </div>
      <p className="mt-1 text-2xl font-semibold text-ink tabular-nums">{value}</p>
    </div>
  );
}
