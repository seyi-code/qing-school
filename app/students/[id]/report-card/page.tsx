import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { notFound } from "next/navigation";
import { PrintButton } from "./PrintButton";
import { SCHOOL } from "@/lib/school-config";
import { formatDate } from "@/lib/format";
import { inferSchoolBand } from "@/lib/report-band";
import Link from "next/link";
import { ReportCardHeader } from "./ReportCardHeader";
import { DomainSection } from "./DomainSection";
import { REPORT_CARD_CSS } from "./report-card-styles";

export const dynamic = "force-dynamic";

type TemplateConfig = {
  schoolName?: string;
  motto?: string;
  footerNote?: string;
  principalTitle?: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
  sessionLabel?: string;
  termLabel?: string;
  teacherRemark?: string;
  principalRemark?: string;
  domainsMode?: "auto" | "primary" | "secondary" | "hidden";
};

const GRADE_SCALE = [
  { grade: "A1", range: "90 – 100", remark: "Excellent" },
  { grade: "B2", range: "80 – 89", remark: "Very Good" },
  { grade: "C", range: "70 – 79", remark: "Good" },
  { grade: "D", range: "60 – 69", remark: "Fair" },
  { grade: "E", range: "50 – 59", remark: "Pass" },
  { grade: "F9", range: "0 – 49", remark: "Fail" },
];

function gradeFromTotal(total: number): { grade: string; remark: string; pill: string } {
  if (total >= 90) return { grade: "A1", remark: "Excellent", pill: "g-a1" };
  if (total >= 80) return { grade: "B2", remark: "Very Good", pill: "g-b2" };
  if (total >= 70) return { grade: "C", remark: "Good", pill: "g-c" };
  if (total >= 60) return { grade: "D", remark: "Fair", pill: "g-d" };
  if (total >= 50) return { grade: "E", remark: "Pass", pill: "g-e" };
  return { grade: "F9", remark: "Fail", pill: "g-f" };
}

function ordinal(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

export default async function ReportCardPage({ params }: { params: { id: string } }) {
  await requireSession();

  const student = await prisma.student.findUnique({
    where: { id: params.id },
    include: {
      school: {
        select: {
          id: true,
          name: true,
          shortName: true,
          motto: true,
          logoUrl: true,
          primaryColor: true,
          accentColor: true,
        },
      },
      arm: { include: { schoolClass: true } },
      scores: {
        include: {
          armSubject: { include: { subject: true } },
          term: true,
        },
      },
      attendances: true,
      documents: { orderBy: { uploadedAt: "desc" }, take: 20 },
    },
  });

  if (!student) notFound();

  const [tpl, term, bands] = await Promise.all([
    student.schoolId
      ? prisma.reportCardTemplate.findFirst({
          where: { name: `school:${student.schoolId}` },
          orderBy: { updatedAt: "desc" },
        })
      : Promise.resolve(null),
    prisma.term.findFirst({
      where: { isCurrent: true },
      include: { session: true },
    }),
    prisma.gradeBand.findMany({ orderBy: { minScore: "desc" } }).catch(() => [] as { minScore: number; maxScore: number; grade: string; remark: string }[]),
  ]);

  const cfg: TemplateConfig = tpl ? (JSON.parse(tpl.configJson) as TemplateConfig) : {};

  const schoolName = cfg.schoolName || student.school?.name || SCHOOL.name;
  const motto = cfg.motto || student.school?.motto || SCHOOL.motto;
  const logoUrl = cfg.logoUrl || student.school?.logoUrl || "/logo.svg";
  const address = cfg.address || SCHOOL.contact.address;
  const phones = [cfg.phone, SCHOOL.contact.phone, SCHOOL.contact.phoneAlt]
    .filter(Boolean)
    .join(" / ");
  const email = cfg.email || SCHOOL.contact.email;
  const principalTitle = cfg.principalTitle || "Principal";

  const sessionLabel = cfg.sessionLabel || term?.session?.name || "2025 / 2026";
  const termLabel = cfg.termLabel
    ? cfg.termLabel
    : term?.name
      ? `${term.name} Report Card · ${sessionLabel}`
      : `Terminal Report Card · ${sessionLabel}`;

  const scores = [...student.scores].sort((a, b) =>
    a.armSubject.subject.name.localeCompare(b.armSubject.subject.name)
  );

  function resolveGrade(total: number, stored?: string | null, remark?: string | null) {
    if (stored) {
      const g = stored.toUpperCase();
      const pill =
        g.startsWith("A") ? "g-a1" : g.startsWith("B") ? "g-b2" : g.startsWith("C") ? "g-c" : g.startsWith("D") ? "g-d" : g.startsWith("E") ? "g-e" : "g-f";
      return { grade: stored, remark: remark || gradeFromTotal(total).remark, pill };
    }
    if (bands.length) {
      const b = bands.find((x) => total >= x.minScore && total <= x.maxScore);
      if (b) {
        const g = b.grade.toUpperCase();
        const pill =
          g.startsWith("A") ? "g-a1" : g.startsWith("B") ? "g-b2" : g.startsWith("C") ? "g-c" : g.startsWith("D") ? "g-d" : g.startsWith("E") ? "g-e" : "g-f";
        return { grade: b.grade, remark: remark || b.remark, pill };
      }
    }
    return gradeFromTotal(total);
  }

  const rows = scores.map((s) => {
    const ca = s.ca1 + s.ca2;
    const { grade, remark, pill } = resolveGrade(s.total, s.grade, s.remark);
    return {
      id: s.id,
      subject: s.armSubject.subject.name,
      ca,
      exam: s.exam,
      total: s.total,
      grade,
      remark,
      pill,
    };
  });

  const totalObtained = rows.reduce((s, r) => s + r.total, 0);
  const maxPossible = rows.length * 100;
  const percentage =
    rows.length > 0 ? ((totalObtained / maxPossible) * 100).toFixed(1) : "—";
  const overallPass =
    rows.length === 0
      ? null
      : rows.filter((r) => r.total >= 50).length >= Math.ceil(rows.length * 0.5);

  const presentDays = student.attendances.filter((a) => a.status === "PRESENT").length;
  const totalDays = student.attendances.length;
  const classLabel = student.arm
    ? `${student.arm.schoolClass.name} ${student.arm.name}`
    : "—";

  const schoolBand = inferSchoolBand(classLabel);
  const scoresTitle = schoolBand === "primary" ? "Cognitive Domain" : "Examination Results";
  const dobLabel = student.dateOfBirth ? formatDate(student.dateOfBirth) : "—";
  let ageLabel = "—";
  if (student.dateOfBirth) {
    const dob = new Date(student.dateOfBirth);
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const md = now.getMonth() - dob.getMonth();
    if (md < 0 || (md === 0 && now.getDate() < dob.getDate())) age -= 1;
    if (age >= 0 && age < 120) ageLabel = `${age} yrs`;
  }

  const fullName = `${student.firstName} ${student.otherNames ?? ""} ${student.lastName}`
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

  const photoDoc = student.documents.find((d) =>
    /photo|passport|portrait|picture|image/i.test(d.label)
  );
  const photoUrl = photoDoc?.fileUrl || null;

  let positionLabel = "—";
  if (student.armId && rows.length > 0) {
    const termIds = [...new Set(scores.map((s) => s.termId).filter(Boolean))];
    const termIdFilter = termIds.length === 1 ? termIds[0] : term?.id ?? undefined;
    const classmates = await prisma.student.findMany({
      where: {
        armId: student.armId,
        status: "ACTIVE",
        ...(student.schoolId ? { schoolId: student.schoolId } : {}),
      },
      select: {
        id: true,
        scores: {
          where: termIdFilter ? { termId: termIdFilter } : undefined,
          select: { total: true },
        },
      },
    });
    const ranked = classmates
      .map((c) => ({
        id: c.id,
        total: c.scores.reduce((sum, sc) => sum + (sc.total || 0), 0),
      }))
      .filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total);
    const rank = ranked.findIndex((c) => c.id === student.id) + 1;
    if (rank > 0) {
      positionLabel = `${ordinal(rank)} of ${ranked.length}`;
    }
  }

  return (
    <>
      <style>{REPORT_CARD_CSS}</style>

      <div className="min-h-screen bg-[#f7f5ef] print:bg-white px-3 sm:px-4 py-4 sm:py-6">
        <div className="no-print max-w-[820px] mx-auto mb-4 flex justify-between items-center gap-3 text-sm">
          <Link href={`/students/${student.id}`} className="text-[#1a3a6e] font-medium hover:underline">
            ← Back to student
          </Link>
          <PrintButton />
        </div>

        <article className="rc-page">
          <ReportCardHeader
            logoUrl={logoUrl}
            schoolName={schoolName}
            motto={motto}
            address={address}
            phones={phones}
            email={email}
            termLabel={termLabel}
            photoUrl={photoUrl}
            studentName={fullName}
          />

          <div className="rc-meta">
            <div className="rc-meta-item">
              <span>Name</span>
              <strong>{fullName}</strong>
            </div>
            <div className="rc-meta-item">
              <span>Admission No.</span>
              <strong>{student.admissionNumber}</strong>
            </div>
            <div className="rc-meta-item">
              <span>Class / Arm</span>
              <strong>{classLabel}</strong>
            </div>
            <div className="rc-meta-item">
              <span>Gender</span>
              <strong>{student.gender ?? "—"}</strong>
            </div>
            <div className="rc-meta-item">
              <span>Date of birth</span>
              <strong>{dobLabel}</strong>
            </div>
            <div className="rc-meta-item">
              <span>Age</span>
              <strong>{ageLabel}</strong>
            </div>
            <div className="rc-meta-item">
              <span>Session</span>
              <strong>{sessionLabel}</strong>
            </div>
            <div className="rc-meta-item">
              <span>Position in Class</span>
              <strong>{positionLabel}</strong>
            </div>
          </div>

          <section className="rc-section">
            <h2 className="rc-section-title">{scoresTitle}</h2>
            <div className="rc-table-wrap">
              <table className="rc-scores">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>CA (40)</th>
                    <th>Exam (60)</th>
                    <th>Total (100)</th>
                    <th>Grade</th>
                    <th>Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "#4a5265" }}>
                        No scores entered for this student yet.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => (
                      <tr key={r.id}>
                        <td>{r.subject}</td>
                        <td>{r.ca}</td>
                        <td>{r.exam}</td>
                        <td>
                          <strong>{r.total}</strong>
                        </td>
                        <td>
                          <span className={`grade-pill ${r.pill}`}>{r.grade}</span>
                        </td>
                        <td>{r.remark}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <div className="rc-summary">
            <div className="rc-summary-item">
              <div className="label">Total Obtained</div>
              <div className="value">{rows.length ? totalObtained : "—"}</div>
              <div className="sub">{rows.length ? `of ${maxPossible}` : "—"}</div>
            </div>
            <div className="rc-summary-item">
              <div className="label">Percentage</div>
              <div className="value">{rows.length ? `${percentage}%` : "—"}</div>
              <div className="sub">Average</div>
            </div>
            <div className="rc-summary-item">
              <div className="label">Subjects</div>
              <div className="value">{rows.length || "—"}</div>
              <div className="sub">Offered</div>
            </div>
            <div className="rc-summary-item">
              <div className="label">Overall</div>
              <div
                className="value"
                style={{
                  color:
                    overallPass === null ? "#1a3a6e" : overallPass ? "#2d6a4f" : "#c41e3a",
                }}
              >
                {overallPass === null ? "—" : overallPass ? "PASS" : "FAIL"}
              </div>
              <div className="sub">{overallPass ? "Good standing" : overallPass === false ? "Needs support" : "—"}</div>
            </div>
          </div>

          <DomainSection classLabel={classLabel} domainsMode={cfg.domainsMode} />

          <section className="rc-section" style={{ paddingBottom: 0 }}>
            <h2 className="rc-section-title">Attendance Summary</h2>
          </section>
          <div className="rc-attendance">
            <div className="rc-att-item">
              <span>Days recorded</span>
              <strong>{totalDays}</strong>
            </div>
            <div className="rc-att-item">
              <span>Times present</span>
              <strong>{presentDays}</strong>
            </div>
            <div className="rc-att-item">
              <span>Attendance rate</span>
              <strong>
                {totalDays > 0 ? `${Math.round((presentDays / totalDays) * 100)}%` : "—"}
              </strong>
            </div>
            <div className="rc-att-item">
              <span>Status</span>
              <strong>{student.status}</strong>
            </div>
          </div>

          <section className="rc-section">
            <h2 className="rc-section-title">Remarks</h2>
            <div className="rc-remark-box">
              <div className="who">Class Teacher's Remark</div>
              <p>
                {cfg.teacherRemark ||
                  (rows.length
                    ? `${student.firstName} has completed this term with ${rows.length} subject(s) recorded. Continue to encourage steady practice and attendance.`
                    : "No scores entered yet for this term.")}
              </p>
              <div className="sign">
                <span>Signature / Date</span>
                <span>………………………</span>
              </div>
            </div>
            <div className="rc-remark-box">
              <div className="who">{principalTitle}'s Remark</div>
              <p>
                {cfg.principalRemark ||
                  "Keep working hard and maintain good character. Education with Godliness."}
              </p>
              <div className="sign">
                <span>Signature / Date</span>
                <span>………………………</span>
              </div>
            </div>
          </section>

          <section className="rc-section">
            <h2 className="rc-section-title">Grade Scale</h2>
            <div className="rc-grade-scale">
              <table>
                <tbody>
                  {GRADE_SCALE.map((g) => (
                    <tr key={g.grade}>
                      <td>{g.grade}</td>
                      <td>{g.range}</td>
                      <td>{g.remark}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div style={{ padding: "0.75rem 1.5rem 1.25rem", fontSize: "0.78rem", color: "#4a5265" }}>
            <strong style={{ color: "#1a3a6e" }}>Next term begins:</strong> ………………………
          </div>

          <footer className="rc-footer">
            <strong>{schoolName}</strong>
            {motto ? ` · ${motto}` : ""} · This is a computer-generated report. Verify with the school
            stamp for official use.
          </footer>
        </article>
      </div>
    </>
  );
}
