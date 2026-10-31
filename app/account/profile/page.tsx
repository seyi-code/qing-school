import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { PortalShell } from "@/components/PortalShell";
import { ProfileForm } from "@/components/ProfileForm";
import { homeRouteForRole } from "@/lib/permissions";
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
      parentLinks: {
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              admissionNumber: true,
              status: true,
              arm: { include: { schoolClass: true } },
              school: { select: { name: true, shortName: true } },
            },
          },
        },
      },
      school: { select: { name: true, shortName: true } },
    },
  });

  if (!user) {
    return (
      <PortalShell role={session.role} title="Profile" email={session.email}>
        <p className="text-sm text-brick">Account not found.</p>
      </PortalShell>
    );
  }

  const home = homeRouteForRole(session.role);
  const schoolName =
    user.student?.school?.name ||
    user.parentLinks[0]?.student.school?.name ||
    user.school?.name ||
    undefined;
  const schoolShort =
    user.student?.school?.shortName ||
    user.parentLinks[0]?.student.school?.shortName ||
    user.school?.shortName ||
    undefined;

  const isParent = session.role === "PARENT";
  const isPlatform = session.role === "PLATFORM_ADMIN";

  return (
    <PortalShell
      role={session.role}
      title="My profile"
      subtitle="Account details and security"
      email={session.email}
      schoolName={schoolName}
      schoolShortName={schoolShort}
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href={home} className="btn-ghost text-sm">
            ← {isParent ? "Family dashboard" : isPlatform ? "Platform" : "Dashboard"}
          </Link>
          <Link href="/account/password" className="btn-ghost text-sm">
            Change password
          </Link>
        </div>
      }
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
            <span className="inline-block mt-0.5 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md border border-navy/20 bg-navy/5 text-navy">
              {user.role}
            </span>
          </p>
          {isPlatform && (
            <p className="text-xs text-ink/50 pt-1">
              Platform accounts manage schools and billing. Email and role are fixed here; use{" "}
              <Link href="/platform" className="text-navy underline">
                Platform
              </Link>{" "}
              for tenant operations.
            </p>
          )}
        </section>

        {user.student && (
          <section className="rounded-xl border border-line/80 bg-white p-4 sm:p-5 shadow-sm space-y-3">
            <h2 className="font-serif text-base text-navy">Student record</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-ink/50 text-[10px] uppercase tracking-wide font-medium">Name</dt>
                <dd className="font-medium text-ink mt-0.5">
                  {user.student.firstName} {user.student.lastName}
                  {user.student.otherNames ? ` ${user.student.otherNames}` : ""}
                </dd>
              </div>
              <div>
                <dt className="text-ink/50 text-[10px] uppercase tracking-wide font-medium">
                  Admission no.
                </dt>
                <dd className="font-mono text-sm mt-0.5">{user.student.admissionNumber}</dd>
              </div>
              {user.student.arm && (
                <div>
                  <dt className="text-ink/50 text-[10px] uppercase tracking-wide font-medium">Class</dt>
                  <dd className="font-medium text-ink mt-0.5">
                    {user.student.arm.schoolClass.name} {user.student.arm.name}
                  </dd>
                </div>
              )}
              {user.student.school && (
                <div>
                  <dt className="text-ink/50 text-[10px] uppercase tracking-wide font-medium">School</dt>
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

        {isParent && (
          <section className="rounded-xl border border-amber-200/70 bg-gradient-to-br from-amber-50/50 to-white p-4 sm:p-5 shadow-sm space-y-3">
            <h2 className="font-serif text-base text-navy">Linked children</h2>
            <p className="text-xs text-ink/50">
              These are the students linked to this parent account. Details are managed by the school
              office.
            </p>
            {user.parentLinks.length === 0 ? (
              <p className="text-sm text-ink/60 rounded-lg border border-line/70 bg-white p-3">
                No children linked yet. Ask the school office to link your ward(s) to{" "}
                <span className="font-medium">{user.email}</span>.
              </p>
            ) : (
              <ul className="space-y-3">
                {user.parentLinks.map((link) => {
                  const s = link.student;
                  const classLabel = s.arm
                    ? `${s.arm.schoolClass.name} ${s.arm.name}`
                    : "Class not assigned";
                  return (
                    <li
                      key={link.id}
                      className="rounded-xl border border-line/80 bg-white p-3.5 space-y-2"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-navy">
                            {s.firstName} {s.lastName}
                          </p>
                          <p className="text-xs text-ink/50 mt-0.5">
                            {s.admissionNumber} · {classLabel}
                          </p>
                          {link.relation && (
                            <p className="text-[10px] uppercase tracking-wide text-ink/40 mt-1">
                              Relation: {link.relation}
                            </p>
                          )}
                        </div>
                        <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md border border-line text-ink/60">
                          {s.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/students/${s.id}/report-card`}
                          className="text-xs text-navy underline"
                        >
                          Report card
                        </Link>
                        <Link href="/portal/parent" className="text-xs text-navy underline">
                          Family dashboard
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {user.staff ? (
          <section className="rounded-xl border border-line/80 bg-white p-4 sm:p-5 shadow-sm space-y-3">
            <h2 className="font-serif text-base text-navy">Staff details</h2>
            {user.staff.staffId && (
              <p className="text-sm">
                <span className="text-ink/50 text-[10px] uppercase tracking-wide font-medium">
                  Staff ID
                </span>
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
        ) : !user.student && !isParent && !isPlatform ? (
          <p className="text-sm text-ink/60 rounded-xl border border-line/80 bg-white p-4">
            No staff or student profile linked. Email and role are managed by your school
            administrator.
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
