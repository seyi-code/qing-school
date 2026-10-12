import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { notFound } from "next/navigation";
import { PrintButton } from "./PrintButton";
import { SCHOOL } from "@/lib/school-config";
import { getBrandingForSchoolId } from "@/lib/branding";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

/** Report-card template config (stored in ReportCardTemplate.configJson) */
type TemplateConfig = {
  schoolName?: string;
  motto?: string;
  footerNote?: string;
  showPosition?: boolean;
  showAttendance?: boolean;
  showDomains?: boolean;
  showGradeScale?: boolean;
  principalTitle?: string;
  headerBg?: string;
  accentColor?: string;
  logoUrl?: string;
  /** "auto" | "nursery" | "primary" | "secondary" */
  level?: "auto" | "nursery" | "primary" | "secondary";
  /** "ca-exam" (nursery/primary) | "ca1-ca2-exam" (secondary) */
  scoreLayout?: "ca-exam" | "ca1-ca2-exam" | "auto";
  termLabel?: string;
  sections?: string[];
  psychomotor?: { name: string; rating: 1 | 2 | 3 | 4 | 5 }[];
  affective?: { name: string; rating: 1 | 2 | 3 | 4 | 5 }[];
  teacherRemark?: string;
  principalRemark?: string;
};

const DEFAULT_SECTIONS = [
  "header",
  "studentInfo",
  "scoresTable",
  "summary",
  "domains",
  "attendance",
  "remarks",
  "gradeScale",
  "signatures",
  "footer",
];

const DEFAULT_PSYCHOMOTOR = [
  { name: "Handling of Tools", rating: 3 as const },
  { name: "Drawing / Painting", rating: 3 as const },
  { name: "Handwriting", rating: 4 as const },
  { name: "Public Speaking", rating: 4 as const },
  { name: "French Fluency", rating: 2 as const },
  { name: "Sports & Games", rating: 2 as const },
];

const DEFAULT_AFFECTIVE = [
  { name: "Attentiveness", rating: 5 as const },
  { name: "Honesty", rating: 5 as const },
  { name: "Neatness", rating: 4 as const },
  { name: "Politeness", rating: 5 as const },
  { name: "Punctuality", rating: 2 as const },
  { name: "Self Control", rating: 2 as const },
  { name: "Obedience", rating: 2 as const },
  { name: "Reliability", rating: 4 as const },
  { name: "Responsibility", rating: 4 as const },
  { name: "Relationship with others", rating: 4 as const },
];

const GRADE_SCALE = [
  { grade: "A1", range: "90 – 100", remark: "Excellent" },
  { grade: "B2", range: "80 – 89", remark: "Very Good" },
  { grade: "C", range: "70 – 79", remark: "Good" },
  { grade: "D", range: "60 – 69", remark: "Fair" },
  { grade: "E", range: "50 – 59", remark: "Pass" },
  { grade: "F9", range: "0 – 49", remark: "Fail" },
];

function detectLevel(className: string): "nursery" | "primary" | "secondary" {
  const n = className.toUpperCase();
  if (/\b(PRE[- ]?NUR|NUR|KG|CRECHE|PLAY)\b/.test(n)) return "nursery";
  if (/\b(PRY|PRIMARY|BASIC\s*[1-6]|P[1-6])\b/.test(n)) return "primary";
  return "secondary";
}

function gradePillClass(grade: string | null | undefined): string {
  if (!grade) return "bg-line text-ink/60";
  const g = grade.toUpperCase();
  if (g.startsWith("A")) return "bg-green-100 text-green-800";
  if (g.startsWith("B")) return "bg-blue-100 text-blue-800";
  if (g.startsWith("C")) return "bg-amber-100 text-amber-800";
  if (g.startsWith("D") || g.startsWith("E")) return "bg-orange-100 text-orange-800";
  return "bg-red-100 text-red-800";
}

function RatingDots({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[5, 4, 3, 2, 1].map((n) => (
        <span
          key={n}
          className={`inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold border ${
            rating === n
              ? "bg-gold border-gold text-white"
              : "border-line text-transparent"
          }`}
        >
          {n}
        </span>
      ))}
    </div>
  );
}

export default async function ReportCardPage({ params }: { params: { id: string } }) {
  await requireSession();

  const [student, tpl, gradeBands] = await Promise.all([
    prisma.student.findUnique({
      where: { id: params.id },
      include: {
        arm: { include: { schoolClass: true } },
        scores: {
          include: { armSubject: { include: { subject: true } }, term: true },
          orderBy: { armSubject: { subject: { name: "asc" } } },
        },
        attendances: true,
        documents: { orderBy: { uploadedAt: "desc" } },
        school: true,
      },
    }),
    prisma.reportCardTemplate.findFirst({ orderBy: { updatedAt: "desc" } }),
    prisma.gradeBand.findMany({ orderBy: { minScore: "desc" } }),
  ]);

  if (!student) notFound();

  const branding = await getBrandingForSchoolId(student.schoolId);

  const cfg: TemplateConfig = tpl
    ? (JSON.parse(tpl.configJson) as TemplateConfig)
    : {};

  const className = student.arm?.schoolClass?.name ?? "";
  const level =
    cfg.level && cfg.level !== "auto"
      ? cfg.level
      : detectLevel(className || student.arm?.name || "");

  const scoreLayout: "ca-exam" | "ca1-ca2-exam" =
    cfg.scoreLayout && cfg.scoreLayout !== "auto"
      ? cfg.scoreLayout
      : level === "secondary"
        ? "ca1-ca2-exam"
        : "ca-exam";

  const sections = cfg.sections?.length ? cfg.sections : DEFAULT_SECTIONS;
  const has = (id: string) => sections.includes(id);

  const schoolName = cfg.schoolName || branding.name;
  const motto = cfg.motto || branding.motto;
  const logoUrl = cfg.logoUrl || branding.logoUrl || "/logo.svg";
  const headerBg = cfg.headerBg || branding.primaryColor || SCHOOL.colors.primary;
  const accent = cfg.accentColor || branding.accentColor || SCHOOL.colors.gold;
  const principalTitle = cfg.principalTitle || "Principal";
  const termLabel =
    cfg.termLabel ||
    student.scores[0]?.term?.name ||
    "Terminal";

  const totalScore = student.scores.reduce((s, sc) => s + sc.total, 0);
  const maxPerSubject = 100;
  const obtainable = student.scores.length * maxPerSubject;
  const average =
    student.scores.length > 0
      ? (totalScore / student.scores.length).toFixed(1)
      : "—";
  const pct =
    obtainable > 0 ? ((totalScore / obtainable) * 100).toFixed(1) : "—";

  const presentDays = student.attendances.filter((a) => a.status === "PRESENT").length;
  const totalDays = student.attendances.length;

  const classLabel = student.arm
    ? `${student.arm.schoolClass.name} ${student.arm.name}`
    : "—";

  // Photo: first document whose label looks like a photo, else placeholder
  const photoDoc = student.documents.find((d) =>
    /photo|passport|picture|portrait|image/i.test(d.label)
  );
  const photoUrl = photoDoc?.fileUrl ?? null;

  const psychomotor = cfg.psychomotor?.length ? cfg.psychomotor : DEFAULT_PSYCHOMOTOR;
  const affective = cfg.affective?.length ? cfg.affective : DEFAULT_AFFECTIVE;

  const teacherRemark =
    cfg.teacherRemark ||
    (level === "nursery" || level === "primary"
      ? "Has shown good progress this term. Continue to encourage consistent practice at home."
      : "Keep working hard and maintain a steady improvement across all subjects.");
  const principalRemark =
    cfg.principalRemark ||
    "I encourage you to take advantage of tutorials and additional resources to help you succeed. Education with Godliness.";

  const scale = gradeBands.length
    ? gradeBands.map((b) => ({
        grade: b.grade,
        range: `${b.minScore} – ${b.maxScore}`,
        remark: b.remark,
      }))
    : GRADE_SCALE;

  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-8 font-sans text-ink bg-paper min-h-screen">
      <div className="no-print mb-5 flex justify-between items-center gap-3">
        <a
          href={`/students/${student.id}`}
          className="text-sm text-navy hover:underline"
        >
          ← Back to student
        </a>
        <PrintButton />
      </div>

      <article className="report-card-print border border-line bg-white shadow-sm overflow-hidden print:shadow-none print:border-0">
        {/* ── HEADER ── */}
        {has("header") && (
          <header
            className="text-center text-paper px-4 py-5 sm:px-6 relative"
            style={{ background: headerBg }}
          >
            <div
              className="absolute bottom-0 left-0 right-0 h-1"
              style={{
                background: `linear-gradient(90deg, ${accent}, #e8d48b, ${accent})`,
              }}
            />
            <div className="flex items-center justify-center gap-3 mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt=""
                className="h-14 w-14 object-contain bg-white/10 rounded-full p-1"
              />
              <div className="text-left">
                <h1 className="font-serif text-xl sm:text-2xl leading-tight">
                  {schoolName}
                </h1>
                {motto && (
                  <p className="text-[11px] sm:text-xs opacity-90 italic mt-0.5">
                    {motto}
                  </p>
                )}
              </div>
            </div>
            <p className="text-[10px] sm:text-[11px] opacity-75 mt-2 leading-relaxed">
              {branding.address}
              <br />
              Tel: {branding.phone}
              {branding.phoneAlt ? ` / ${branding.phoneAlt}` : ""}
              {branding.email ? ` · ${branding.email}` : ""}
            </p>
            <p
              className="text-[11px] mt-3 tracking-[0.15em] uppercase font-semibold"
              style={{ color: accent }}
            >
              {termLabel} Report Card
            </p>
          </header>
        )}

        {/* ── STUDENT INFO + PHOTO ── */}
        {has("studentInfo") && (
          <div className="flex gap-3 sm:gap-4 p-3 sm:p-5 border-b border-line bg-[#faf8f3]">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm min-w-0">
              <InfoRow label="Name" value={`${student.lastName}, ${student.firstName}${student.otherNames ? " " + student.otherNames : ""}`} />
              <InfoRow label="Admission No." value={student.admissionNumber} />
              <InfoRow label="Class / Arm" value={classLabel} />
              <InfoRow label="Gender" value={student.gender ?? "—"} />
              <InfoRow
                label="Date of birth"
                value={student.dateOfBirth ? formatDate(student.dateOfBirth) : "—"}
              />
              <InfoRow label="Status" value={student.status} />
              <InfoRow
                label="Level"
                value={level.charAt(0).toUpperCase() + level.slice(1)}
              />
              <InfoRow label="Session" value={cfg.termLabel ? "—" : "Current"} />
            </div>
            {/* Photo box — right side like the Excel sample */}
            <div className="shrink-0 w-[88px] sm:w-[110px]">
              <div className="aspect-[3/4] border-2 border-navy/30 bg-white flex items-center justify-center overflow-hidden rounded-sm">
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoUrl}
                    alt="Student"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-2 text-ink/40">
                    <svg
                      className="w-8 h-8 mx-auto mb-1 opacity-50"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                      />
                    </svg>
                    <p className="text-[9px] leading-tight">Student photo</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="p-3 sm:p-5">
          {/* ── COGNITIVE / SCORES ── */}
          {has("scoresTable") && (
            <section className="mb-5">
              <h2 className="font-serif text-base text-navy border-b-2 border-navy pb-1 mb-3">
                Cognitive Domain
              </h2>

              {/* Mobile cards */}
              <div className="sm:hidden space-y-2.5 print:hidden">
                {student.scores.length === 0 && (
                  <p className="text-center text-ink/50 py-6 text-sm border border-dashed border-line">
                    No scores entered for this student yet.
                  </p>
                )}
                {student.scores.map((s) => {
                  const ca =
                    scoreLayout === "ca-exam"
                      ? s.ca1 + s.ca2 || s.ca1
                      : null;
                  return (
                    <div
                      key={s.id}
                      className="border border-line rounded-sm p-3 text-sm"
                    >
                      <p className="font-medium text-navy mb-2">
                        {s.armSubject.subject.name}
                      </p>
                      <div
                        className={`grid gap-2 text-center text-xs mb-2 ${
                          scoreLayout === "ca-exam"
                            ? "grid-cols-3"
                            : "grid-cols-4"
                        }`}
                      >
                        {scoreLayout === "ca-exam" ? (
                          <>
                            <div>
                              <p className="text-ink/50">CA</p>
                              <p className="font-medium">{ca}</p>
                            </div>
                            <div>
                              <p className="text-ink/50">Exam</p>
                              <p className="font-medium">{s.exam}</p>
                            </div>
                            <div>
                              <p className="text-ink/50">Total</p>
                              <p className="font-medium">{s.total}</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <p className="text-ink/50">CA1</p>
                              <p className="font-medium">{s.ca1}</p>
                            </div>
                            <div>
                              <p className="text-ink/50">CA2</p>
                              <p className="font-medium">{s.ca2}</p>
                            </div>
                            <div>
                              <p className="text-ink/50">Exam</p>
                              <p className="font-medium">{s.exam}</p>
                            </div>
                            <div>
                              <p className="text-ink/50">Total</p>
                              <p className="font-medium">{s.total}</p>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="flex justify-between gap-2 border-t border-line pt-2 text-xs">
                        <span>
                          <span className="text-ink/50">Grade: </span>
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${gradePillClass(s.grade)}`}
                          >
                            {s.grade ?? "—"}
                          </span>
                        </span>
                        <span className="text-right max-w-[55%] truncate">
                          {s.remark ?? "—"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop / print table */}
              <div className="hidden sm:block overflow-x-auto print:block">
                <table className="w-full text-[13px] border-collapse min-w-[520px]">
                  <thead>
                    <tr style={{ background: headerBg, color: "#fff" }}>
                      <th className="text-left py-2 px-2 font-semibold">Subject</th>
                      {scoreLayout === "ca-exam" ? (
                        <>
                          <th className="text-right px-2 font-semibold">CA</th>
                          <th className="text-right px-2 font-semibold">Exam</th>
                        </>
                      ) : (
                        <>
                          <th className="text-right px-2 font-semibold">CA1</th>
                          <th className="text-right px-2 font-semibold">CA2</th>
                          <th className="text-right px-2 font-semibold">Exam</th>
                        </>
                      )}
                      <th className="text-right px-2 font-semibold">Total</th>
                      <th className="text-center px-2 font-semibold">Grade</th>
                      <th className="text-left pl-2 font-semibold">Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {student.scores.map((s, i) => {
                      const ca =
                        scoreLayout === "ca-exam"
                          ? s.ca1 + s.ca2 || s.ca1
                          : null;
                      return (
                        <tr
                          key={s.id}
                          className={`border-b border-line ${i % 2 === 1 ? "bg-[#f9f7f1]" : ""}`}
                        >
                          <td className="py-1.5 px-2 font-medium">
                            {s.armSubject.subject.name}
                          </td>
                          {scoreLayout === "ca-exam" ? (
                            <>
                              <td className="text-right px-2">{ca}</td>
                              <td className="text-right px-2">{s.exam}</td>
                            </>
                          ) : (
                            <>
                              <td className="text-right px-2">{s.ca1}</td>
                              <td className="text-right px-2">{s.ca2}</td>
                              <td className="text-right px-2">{s.exam}</td>
                            </>
                          )}
                          <td className="text-right px-2 font-semibold">{s.total}</td>
                          <td className="text-center px-2">
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${gradePillClass(s.grade)}`}
                            >
                              {s.grade ?? "—"}
                            </span>
                          </td>
                          <td className="pl-2 text-ink/80">{s.remark ?? "—"}</td>
                        </tr>
                      );
                    })}
                    {student.scores.length === 0 && (
                      <tr>
                        <td
                          colSpan={scoreLayout === "ca-exam" ? 6 : 7}
                          className="text-center text-ink/50 py-8"
                        >
                          No scores entered for this student yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ── SUMMARY STRIP ── */}
          {has("summary") && student.scores.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-5 p-3 bg-[#faf8f3] border border-line rounded-sm">
              <SummaryItem label="Total obtained" value={String(totalScore)} sub={`of ${obtainable}`} />
              <SummaryItem label="Percentage" value={`${pct}%`} sub="Average" />
              <SummaryItem label="Subjects" value={String(student.scores.length)} sub="Offered" />
              <SummaryItem
                label="Overall"
                value={Number(pct) >= 50 ? "PASS" : "FAIL"}
                sub={Number(pct) >= 70 ? "Good standing" : Number(pct) >= 50 ? "Fair" : "Needs support"}
                highlight={Number(pct) >= 50}
              />
            </div>
          )}

          {/* ── DOMAINS ── */}
          {has("domains") && cfg.showDomains !== false && (
            <section className="mb-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <DomainCard title="Psychomotor Domain" items={psychomotor} />
                <DomainCard title="Affective Domain" items={affective} />
              </div>
              <p className="text-[10px] text-ink/50 mt-2 leading-relaxed">
                <strong>Rating key:</strong> 5 = Excellent · 4 = High · 3 = Acceptable · 2 = Minimal · 1 = Needs improvement
              </p>
            </section>
          )}

          {/* ── ATTENDANCE ── */}
          {has("attendance") && cfg.showAttendance !== false && (
            <section className="mb-5">
              <h2 className="font-serif text-base text-navy border-b-2 border-navy pb-1 mb-3">
                Attendance Summary
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-ink/50">Days recorded</p>
                  <p className="font-semibold">{totalDays || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-ink/50">Times present</p>
                  <p className="font-semibold">{presentDays || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-ink/50">Attendance rate</p>
                  <p className="font-semibold">
                    {totalDays > 0
                      ? `${Math.round((presentDays / totalDays) * 100)}%`
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-ink/50">Average score</p>
                  <p className="font-semibold">{average}</p>
                </div>
              </div>
            </section>
          )}

          {/* ── REMARKS ── */}
          {has("remarks") && (
            <section className="mb-5">
              <h2 className="font-serif text-base text-navy border-b-2 border-navy pb-1 mb-3">
                Remarks
              </h2>
              <div className="space-y-3">
                <RemarkBox who="Class Teacher's Remark" text={teacherRemark} />
                <RemarkBox who={`${principalTitle}'s Remark`} text={principalRemark} />
              </div>
            </section>
          )}

          {/* ── GRADE SCALE ── */}
          {has("gradeScale") && cfg.showGradeScale !== false && (
            <section className="mb-5">
              <h2 className="font-serif text-base text-navy border-b-2 border-navy pb-1 mb-3">
                Grade Scale
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs">
                {scale.map((g) => (
                  <div key={g.grade} className="flex gap-2 py-0.5">
                    <span className="font-bold text-navy w-7">{g.grade}</span>
                    <span className="text-ink/60 w-16">{g.range}</span>
                    <span>{g.remark}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── SIGNATURES ── */}
          {has("signatures") && (
            <div className="grid grid-cols-2 gap-8 mt-8 text-sm">
              <div className="border-t border-ink/40 pt-2 text-center text-ink/70">
                Class teacher
              </div>
              <div className="border-t border-ink/40 pt-2 text-center text-ink/70">
                {principalTitle}
              </div>
            </div>
          )}

          {/* Next term */}
          <p className="text-sm text-ink/60 mt-6">
            <strong className="text-navy">Next term begins:</strong> ………………………
          </p>
        </div>

        {/* ── FOOTER ── */}
        {has("footer") && (
          <footer
            className="text-center text-[10px] px-4 py-3 text-paper/80"
            style={{ background: SCHOOL.colors.primaryDark }}
          >
            <span className="text-gold font-semibold">{schoolName}</span>
            {" · "}
            {motto}
            {" · "}
            {cfg.footerNote ||
              "This is a computer-generated report. Verify with the school stamp for official use."}
          </footer>
        )}
      </article>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1.5 min-w-0">
      <span className="text-ink/50 shrink-0 text-[13px]">{label}</span>
      <strong className="truncate text-[13px]">{value}</strong>
    </div>
  );
}

function SummaryItem({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className="text-center">
      <p className="text-[10px] uppercase tracking-wide text-ink/50 mb-0.5">{label}</p>
      <p
        className={`font-serif text-xl font-semibold tabular-nums ${
          highlight ? "text-sage" : "text-navy"
        }`}
      >
        {value}
      </p>
      {sub && <p className="text-[10px] text-ink/50">{sub}</p>}
    </div>
  );
}

function DomainCard({
  title,
  items,
}: {
  title: string;
  items: { name: string; rating: number }[];
}) {
  return (
    <div className="border border-line rounded-sm overflow-hidden">
      <h3 className="bg-navy text-paper text-[11px] font-semibold tracking-wide uppercase px-3 py-1.5">
        {title}
      </h3>
      <ul className="px-3 py-1.5 text-xs">
        {items.map((item) => (
          <li
            key={item.name}
            className="flex justify-between items-center py-1 border-b border-line/60 last:border-0"
          >
            <span>{item.name}</span>
            <RatingDots rating={item.rating} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function RemarkBox({ who, text }: { who: string; text: string }) {
  return (
    <div className="border border-line rounded-sm p-3 bg-[#faf8f3] text-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-navy mb-1">
        {who}
      </p>
      <p className="text-ink/80 leading-relaxed">{text}</p>
      <div className="mt-3 pt-2 border-t border-dashed border-line flex justify-between text-[11px] text-ink/50">
        <span>Signature / Date</span>
        <span>………………………</span>
      </div>
    </div>
  );
}
