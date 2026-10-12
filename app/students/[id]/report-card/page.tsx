import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { notFound } from "next/navigation";
import { PrintButton } from "./PrintButton";
import { SCHOOL } from "@/lib/school-config";
import { formatDate } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

type TemplateConfig = {
  schoolName?: string;
  motto?: string;
  footerNote?: string;
  showPosition?: boolean;
  showAttendance?: boolean;
  principalTitle?: string;
  headerBg?: string;
  accentColor?: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
  sessionLabel?: string;
  termLabel?: string;
};

export default async function ReportCardPage({ params }: { params: { id: string } }) {
  await requireSession();

  const [student, tpl, term] = await Promise.all([
    prisma.student.findUnique({
      where: { id: params.id },
      include: {
        school: { select: { name: true, shortName: true } },
        arm: { include: { schoolClass: true } },
        scores: {
          include: { armSubject: { include: { subject: true } }, term: true },
          orderBy: { armSubject: { subject: { name: "asc" } } },
        },
        attendances: true,
      },
    }),
    prisma.reportCardTemplate.findFirst({ orderBy: { updatedAt: "desc" } }),
    prisma.term.findFirst({ where: { isCurrent: true } }).catch(() => null),
  ]);

  if (!student) notFound();

  const cfg: TemplateConfig = tpl
    ? (JSON.parse(tpl.configJson) as TemplateConfig)
    : {};

  // Brand: prefer deep navy / gold (sample). Ignore washed-out template blues.
  const headerBg =
    cfg.headerBg && !isHarshBlue(cfg.headerBg) ? cfg.headerBg : "#0f2748";
  const accent = cfg.accentColor || SCHOOL.colors.gold;
  const schoolName = cfg.schoolName || student.school?.name || SCHOOL.name;
  const motto = cfg.motto || SCHOOL.motto;
  const logoUrl = cfg.logoUrl || "/logo.svg";
  const address = cfg.address || SCHOOL.contact.address;
  const phones = [cfg.phone, SCHOOL.contact.phone, SCHOOL.contact.phoneAlt]
    .filter(Boolean)
    .join(" / ");
  const email = cfg.email || SCHOOL.contact.email;
  const principalTitle = cfg.principalTitle || "Principal";

  const sessionLabel =
    cfg.sessionLabel ||
    (term ? `${term.sessionYear || ""}`.trim() : "") ||
    "2025 / 2026";
  const termLabel =
    cfg.termLabel ||
    (term?.name ? `${term.name.toUpperCase()} REPORT CARD` : "TERMINAL REPORT CARD");

  const totalScore = student.scores.reduce((s, sc) => s + sc.total, 0);
  const average = student.scores.length
    ? (totalScore / student.scores.length).toFixed(1)
    : "—";
  const presentDays = student.attendances.filter((a) => a.status === "PRESENT").length;
  const totalDays = student.attendances.length;
  const attendanceRate =
    totalDays > 0 ? `${Math.round((presentDays / totalDays) * 100)}%` : "—";
  const classLabel = student.arm
    ? `${student.arm.schoolClass.name} ${student.arm.name}`
    : "—";

  return (
    <div className="min-h-screen bg-[#f0eee8] print:bg-white">
      <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-8 font-sans text-ink">
        <div className="no-print mb-4 flex justify-between items-center gap-3">
          <Link
            href={`/students/${student.id}`}
            className="text-sm text-navy font-medium hover:underline"
          >
            ← Back to student
          </Link>
          <PrintButton />
        </div>

        {/* Card shell */}
        <article className="bg-white shadow-lg print:shadow-none overflow-hidden rounded-sm border border-black/5">
          {/* Header — deep navy, centered brand */}
          <header
            className="relative text-center text-white px-5 pt-7 pb-6 sm:px-10 sm:pt-9 sm:pb-7"
            style={{ background: headerBg }}
          >
            <div className="mx-auto mb-3 h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem] rounded-full bg-white/10 ring-2 ring-white/25 flex items-center justify-center overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt=""
                className="h-12 w-12 sm:h-14 sm:w-14 object-contain"
              />
            </div>
            <h1 className="font-serif text-xl sm:text-2xl md:text-[1.7rem] font-semibold tracking-tight leading-snug">
              {schoolName}
            </h1>
            {motto ? (
              <p className="text-sm italic text-white/85 mt-1.5 font-serif">{motto}</p>
            ) : null}
            <p className="text-[10px] sm:text-[11px] text-white/70 mt-3 leading-relaxed max-w-md mx-auto">
              {address}
              {phones ? (
                <>
                  <br />
                  Tel: {phones}
                </>
              ) : null}
              {email ? (
                <>
                  <br />
                  {email}
                </>
              ) : null}
            </p>
            <p
              className="mt-4 text-[11px] sm:text-xs font-semibold tracking-[0.18em] uppercase"
              style={{ color: accent }}
            >
              {termLabel}
              {sessionLabel ? ` · ${sessionLabel}` : ""}
            </p>
            {/* Gold rule */}
            <div
              className="absolute bottom-0 left-0 right-0 h-[3px]"
              style={{ background: accent }}
            />
          </header>

          <div className="px-4 sm:px-8 py-5 sm:py-7">
            {/* Student identity */}
            <div className="grid grid-cols-[1fr_auto] gap-4 mb-6 pb-5 border-b border-line">
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                <Dt>Name</Dt>
                <Dd className="font-semibold uppercase tracking-wide">
                  {student.firstName} {student.otherNames ?? ""} {student.lastName}
                </Dd>
                <Dt>Admission No.</Dt>
                <Dd className="font-mono text-[13px]">{student.admissionNumber}</Dd>
                <Dt>Class / Arm</Dt>
                <Dd className="font-semibold">{classLabel}</Dd>
                <Dt>Gender</Dt>
                <Dd>{student.gender ?? "—"}</Dd>
                {student.dateOfBirth ? (
                  <>
                    <Dt>Date of birth</Dt>
                    <Dd>{formatDate(student.dateOfBirth)}</Dd>
                  </>
                ) : null}
                <Dt>Session</Dt>
                <Dd>{sessionLabel}</Dd>
                {cfg.showPosition !== false ? (
                  <>
                    <Dt>Position in class</Dt>
                    <Dd>—</Dd>
                  </>
                ) : null}
              </dl>
              <div className="hidden sm:flex h-24 w-20 border border-line rounded-sm items-center justify-center bg-paper/50 text-[10px] text-ink/35 text-center px-1">
                Student
                <br />
                photo
              </div>
            </div>

            {/* Cognitive domain */}
            <section className="mb-6">
              <h2 className="font-serif text-base sm:text-lg text-navy mb-1">Cognitive Domain</h2>
              <div className="h-0.5 w-full bg-navy mb-3" />

              {/* Mobile cards */}
              <div className="sm:hidden space-y-2 print:hidden">
                {student.scores.length === 0 ? (
                  <EmptyScores />
                ) : (
                  student.scores.map((s) => (
                    <div key={s.id} className="border border-line rounded-md p-3 text-sm">
                      <p className="font-medium text-navy mb-2">{s.armSubject.subject.name}</p>
                      <div className="grid grid-cols-4 gap-2 text-center text-xs">
                        <ScoreCell label="CA1" value={s.ca1} />
                        <ScoreCell label="CA2" value={s.ca2} />
                        <ScoreCell label="Exam" value={s.exam} />
                        <ScoreCell label="Total" value={s.total} strong />
                      </div>
                      {(s.grade || s.remark) && (
                        <p className="text-xs text-ink/60 mt-2">
                          {s.grade ? `Grade ${s.grade}` : ""}
                          {s.grade && s.remark ? " · " : ""}
                          {s.remark ?? ""}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Desktop / print table */}
              <div className="hidden sm:block print:block overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr style={{ background: headerBg }} className="text-white">
                      <th className="text-left py-2.5 px-3 font-medium">Subject</th>
                      <th className="text-right py-2.5 px-2 font-medium">CA1</th>
                      <th className="text-right py-2.5 px-2 font-medium">CA2</th>
                      <th className="text-right py-2.5 px-2 font-medium">Exam</th>
                      <th className="text-right py-2.5 px-2 font-medium">Total</th>
                      <th className="text-right py-2.5 px-2 font-medium">Grade</th>
                      <th className="text-left py-2.5 px-3 font-medium">Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {student.scores.map((s, i) => (
                      <tr
                        key={s.id}
                        className={`border-b border-line ${i % 2 === 1 ? "bg-paper/40" : ""}`}
                      >
                        <td className="py-2 px-3">{s.armSubject.subject.name}</td>
                        <td className="text-right px-2 tabular-nums">{s.ca1}</td>
                        <td className="text-right px-2 tabular-nums">{s.ca2}</td>
                        <td className="text-right px-2 tabular-nums">{s.exam}</td>
                        <td className="text-right px-2 font-semibold tabular-nums">{s.total}</td>
                        <td className="text-right px-2">{s.grade ?? "—"}</td>
                        <td className="px-3 text-ink/70">{s.remark ?? "—"}</td>
                      </tr>
                    ))}
                    {student.scores.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center text-ink/45 py-10">
                          No scores entered for this student yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Summary strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <Summary label="Days recorded" value={String(totalDays)} />
              <Summary label="Times present" value={String(presentDays)} />
              <Summary label="Attendance rate" value={attendanceRate} />
              <Summary label="Average score" value={String(average)} />
            </div>

            {/* Remarks */}
            <p className="text-sm italic text-ink/75 mb-8 border-l-2 pl-3" style={{ borderColor: accent }}>
              Keep working hard. {motto}.
            </p>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 sm:gap-16 mt-4 text-sm">
              <div className="border-t border-ink/80 pt-2 text-center font-medium">{principalTitle}</div>
              <div className="border-t border-ink/80 pt-2 text-center font-medium">Class teacher</div>
            </div>

            <p className="text-[10px] text-ink/40 mt-8 text-center">
              {cfg.footerNote ||
                "This is a computer-generated report. Verify with the school office if in doubt."}
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}

function isHarshBlue(hex: string): boolean {
  const h = hex.replace("#", "").toLowerCase();
  if (h === "0000ff" || h === "00f" || h === "0066ff" || h === "0066cc") return true;
  // pure/high-sat blue without navy depth
  if (/^0{0,2}[0-9a-f]{0,2}ff$/i.test(h) && h.length <= 6) return true;
  return false;
}

function Dt({ children }: { children: React.ReactNode }) {
  return <dt className="text-ink/45 text-[13px]">{children}</dt>;
}

function Dd({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <dd className={`text-ink ${className}`}>{children}</dd>;
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-paper/60 px-3 py-2.5 text-center">
      <p className="text-[10px] uppercase tracking-wide text-ink/45 font-medium">{label}</p>
      <p className="text-base font-semibold tabular-nums mt-0.5">{value}</p>
    </div>
  );
}

function ScoreCell({
  label,
  value,
  strong,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div>
      <p className="text-ink/40">{label}</p>
      <p className={strong ? "font-semibold" : ""}>{value}</p>
    </div>
  );
}

function EmptyScores() {
  return (
    <p className="text-center text-ink/40 py-8 text-sm border border-dashed border-line rounded-md">
      No scores entered for this student yet.
    </p>
  );
}
