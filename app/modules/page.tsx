import { requireSession } from "@/lib/require-session";
import { PortalShell } from "@/components/PortalShell";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { resolveSchoolId, schoolWhere } from "@/lib/tenant-scope";

export const dynamic = "force-dynamic";

const TONES = [
  "from-blue-50 to-white border-blue-200/90",
  "from-emerald-50 to-white border-emerald-200/90",
  "from-amber-50 to-white border-amber-200/90",
  "from-violet-50 to-white border-violet-200/90",
  "from-sky-50 to-white border-sky-200/90",
] as const;

export default async function ModulesPage() {
  const session = await requireSession();
  const schoolId = await resolveSchoolId(session);
  const sw = schoolWhere(schoolId);

  const [exams, books, rooms, routes, openLoans, pendingCbt] = await Promise.all([
    prisma.cbtExam.count({ where: sw }),
    prisma.libraryBook.count({ where: sw }),
    prisma.hostelRoom.count({ where: sw }),
    prisma.transportRoute.count({ where: sw }),
    prisma.bookLoan.count({
      where: {
        returnedAt: null,
        ...(schoolId ? { student: { schoolId } } : {}),
      },
    }),
    prisma.cbtAttempt.count({
      where: {
        needsGrading: true,
        ...(schoolId ? { student: { schoolId } } : {}),
      },
    }),
  ]);

  const cards = [
    {
      href: "/cbt",
      title: "CBT / Computer tests",
      blurb: "Timed MCQ & essay tests, question bank, proctoring, results.",
      meta: `${exams} exams · ${pendingCbt} pending grades`,
      icon: "💻",
      roles: ["ADMIN", "IT", "TEACHER", "PRINCIPAL", "STUDENT", "PLATFORM_ADMIN"],
    },
    {
      href: "/library",
      title: "Library",
      blurb: "Catalogue, issue & return, overdue tracking, search.",
      meta: `${books} books · ${openLoans} open loans`,
      icon: "📚",
      roles: ["ADMIN", "IT", "SECRETARY", "TEACHER", "PRINCIPAL", "PLATFORM_ADMIN"],
    },
    {
      href: "/hostel",
      title: "Hostel",
      blurb: "Rooms, beds, gender capacity, allocate & vacate.",
      meta: `${rooms} rooms`,
      icon: "🏠",
      roles: ["ADMIN", "IT", "SECRETARY", "PRINCIPAL", "PLATFORM_ADMIN"],
    },
    {
      href: "/transport",
      title: "Transport",
      blurb: "Bus routes, drivers, enroll riders, bill termly fee.",
      meta: `${routes} routes`,
      icon: "🚌",
      roles: ["ADMIN", "IT", "SECRETARY", "PRINCIPAL", "ACCOUNTANT", "PLATFORM_ADMIN"],
    },
    {
      href: "/settings/report-template",
      title: "Report designer",
      blurb: "Logo, colours, section order, freeform prototype.",
      meta: "Print templates",
      icon: "🎨",
      roles: ["ADMIN", "IT", "PRINCIPAL", "PLATFORM_ADMIN"],
    },
  ].filter((c) => c.roles.includes(session.role));

  return (
    <PortalShell
      role={session.role}
      title="Advanced modules"
      subtitle="CBT, library, hostel, transport — this school only"
      email={session.email}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {cards.map((c, i) => (
          <Link
            key={c.href}
            href={c.href}
            className={`rounded-xl border bg-gradient-to-br p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow block ${TONES[i % TONES.length]}`}
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-serif text-lg text-navy">{c.title}</h2>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/80 text-sm shadow-sm">
                {c.icon}
              </span>
            </div>
            <p className="text-sm text-ink/70 mt-1 leading-relaxed">{c.blurb}</p>
            <p className="text-xs font-medium text-navy/60 mt-3">{c.meta}</p>
          </Link>
        ))}
      </div>
      {cards.length === 0 && (
        <p className="text-sm text-ink/50 rounded-xl border border-line bg-white px-4 py-8 text-center">
          No advanced modules available for your role.
        </p>
      )}
    </PortalShell>
  );
}
