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
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="rounded-xl border border-blue-200/90 bg-gradient-to-br from-blue-50 to-white px-3.5 py-3 shadow-sm">
          <p className="text-[10px] uppercase tracking-wide font-medium text-blue-700/70">Classes led</p>
          <p className="mt-1 text-2xl font-semibold text-blue-900 tabular-nums">{staff.classesLed.length}</p>
        </div>
        <div className="rounded-xl border border-violet-200/90 bg-gradient-to-br from-violet-50 to-white px-3.5 py-3 shadow-sm">
          <p className="text-[10px] uppercase tracking-wide font-medium text-violet-700/70">Subjects</p>
          <p className="mt-1 text-2xl font-semibold text-violet-900 tabular-nums">
            {staff.subjectsTaught.length}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50 to-white px-3.5 py-3 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-[10px] uppercase tracking-wide font-medium text-emerald-700/70">Students</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-800 tabular-nums">{studentCount}</p>
        </div>
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
              <li className="text-ink/50">None assigned as class teacher yet.</li>
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
              <li className="text-ink/50">No subject assignments yet.</li>
            )}
          </ul>
        </section>
      </div>

      <section className="rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/80 to-white p-4 sm:p-5 shadow-sm mb-6">
        <h2 className="font-serif text-lg text-navy mb-3">Quick actions</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/attendance" className="btn-ghost text-sm">
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
