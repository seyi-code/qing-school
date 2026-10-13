import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { PortalShell } from "@/components/PortalShell";
import { ProfileForm } from "@/components/ProfileForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await requireSession();

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      staff: {
        select: {
          firstName: true,
          lastName: true,
          phone: true,
          designation: true,
          category: true,
          staffId: true,
        },
      },
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          otherNames: true,
          admissionNumber: true,
          gender: true,
          dateOfBirth: true,
          status: true,
          arm: { include: { schoolClass: true } },
          school: { select: { name: true, shortName: true } },
        },
      },
    },
  });

  if (!user) {
    return (
      <PortalShell role={session.role} title="Profile" email={session.email}>
        <p className="text-sm text-brick">Account not found.</p>
      </PortalShell>
    );
  }

  return (
    <PortalShell
      role={session.role}
      title="My profile"
      subtitle="Account details and security"
      email={session.email}
      schoolName={user.student?.school?.name}
      schoolShortName={user.student?.school?.shortName}
    >
      <div className="max-w-lg space-y-4 sm:space-y-5">
        <section className="rounded-xl border border-line/80 bg-white p-4 sm:p-5 shadow-sm space-y-3 text-sm">
          <p>
            <span className="text-ink/50 text-[10px] uppercase tracking-wide font-medium">Email</span>
            <br />
            <span className="break-all font-medium text-ink">{user.email}</span>
          </p>
          <p>
            <span className="text-ink/50 text-[10px] uppercase tracking-wide font-medium">Role</span>
            <br />
            <span className="inline-block mt-0.5 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md border bg-navy/5 text-navy border-navy/20">
              {user.role.replace(/_/g, " ")}
            </span>
          </p>
        </section>

        {user.student && (
          <section className="rounded-xl border border-line/80 bg-white p-4 sm:p-5 shadow-sm space-y-3 text-sm">
            <h2 className="font-serif text-base text-navy">Student profile</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-ink/50 font-medium">Full name</dt>
                <dd className="font-medium text-ink mt-0.5">
                  {[user.student.firstName, user.student.otherNames, user.student.lastName]
                    .filter(Boolean)
                    .join(" ")}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-ink/50 font-medium">Admission no.</dt>
                <dd className="font-mono text-xs sm:text-sm font-medium text-ink mt-0.5 break-all">
                  {user.student.admissionNumber}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-ink/50 font-medium">Class</dt>
                <dd className="font-medium text-ink mt-0.5">
                  {user.student.arm
                    ? `${user.student.arm.schoolClass.name} ${user.student.arm.name}`
                    : "Unassigned"}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-ink/50 font-medium">Status</dt>
                <dd className="mt-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md border bg-sage/10 text-sage border-sage/30">
                    {user.student.status}
                  </span>
                </dd>
              </div>
              {user.student.gender && (
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-ink/50 font-medium">Gender</dt>
                  <dd className="font-medium text-ink mt-0.5">{user.student.gender}</dd>
                </div>
              )}
              {user.student.school?.name && (
                <div>
                  <dt className="text-[10px] uppercase tracking-wide text-ink/50 font-medium">School</dt>
                  <dd className="font-medium text-ink mt-0.5">{user.student.school.name}</dd>
                </div>
              )}
            </dl>
            <div className="flex flex-wrap gap-2 pt-1">
              <Link
                href="/portal/student"
                className="inline-flex items-center rounded-xl bg-navy px-3.5 py-2 text-xs font-semibold text-paper hover:bg-navy-light"
              >
                Student portal
              </Link>
              <Link
                href={`/students/${user.student.id}/report-card`}
                className="inline-flex items-center rounded-xl border border-line px-3.5 py-2 text-xs font-medium text-ink hover:border-navy/40"
              >
                Report card
              </Link>
            </div>
            <p className="text-xs text-ink/45">
              Name and class are managed by the school office. You can change your password below.
            </p>
          </section>
        )}

        {user.staff ? (
          <section className="rounded-xl border border-line/80 bg-white p-4 sm:p-5 shadow-sm space-y-3">
            <h2 className="font-serif text-base text-navy">Staff details</h2>
            {user.staff.staffId && (
              <p className="text-sm">
                <span className="text-ink/50 text-[10px] uppercase tracking-wide font-medium">Staff ID</span>
                <br />
                <span className="font-mono text-sm">{user.staff.staffId}</span>
              </p>
            )}
            <ProfileForm
              firstName={user.staff.firstName}
              lastName={user.staff.lastName}
              phone={user.staff.phone || ""}
              designation={user.staff.designation || ""}
            />
          </section>
        ) : !user.student ? (
          <p className="text-sm text-ink/60 rounded-xl border border-line/80 bg-white p-4">
            No staff or student profile linked. Email and role are managed by your school administrator.
          </p>
        ) : null}

        <section className="rounded-xl border border-line/80 bg-white p-4 sm:p-5 shadow-sm space-y-3">
          <h2 className="font-serif text-base text-navy">Security</h2>
          <Link
            href="/account/password"
            className="inline-flex items-center rounded-xl border border-line px-3.5 py-2 text-xs font-medium text-navy hover:border-navy/40"
          >
            Change password →
          </Link>
        </section>
      </div>
    </PortalShell>
  );
}
