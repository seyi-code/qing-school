import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { notFound } from "next/navigation";
import { PrintButton } from "./PrintButton";
import { SCHOOL } from "@/lib/school-config";
import Link from "next/link";
import { ReportCardHeader } from "./ReportCardHeader";

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
};

const PSYCHOMOTOR = [
  "Handling of Tools",
  "Drawing / Painting",
  "Handwriting",
  "Public Speaking",
  "French Fluency",
  "Sports & Games",
];

const AFFECTIVE = [
  "Attentiveness",
  "Honesty",
  "Neatness",
  "Politeness",
  "Punctuality",
  "Self Control",
  "Obedience",
  "Reliability",
  "Responsibility",
  "Relationship with others",
];

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

export default async function ReportCardPage({ params }: { params: { id: string } }) {
  await requireSession();

  const [student, tpl, term, bands] = await Promise.all([
    prisma.student.findUnique({
      where: { id: params.id },
      include: {
        school: { select: { name: true, shortName: true } },
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
    }),
    prisma.reportCardTemplate.findFirst({ orderBy: { updatedAt: "desc" } }),
    prisma.term.findFirst({
      where: { isCurrent: true },
      include: { session: true },
    }),
    prisma.gradeBand.findMany({ orderBy: { minScore: "desc" } }).catch(() => [] as { minScore: number; maxScore: number; grade: string; remark: string }[]),
  ]);

  if (!student) notFound();

  const cfg: TemplateConfig = tpl ? (JSON.parse(tpl.configJson) as TemplateConfig) : {};

  const schoolName = cfg.schoolName || student.school?.name || SCHOOL.name;
  const motto = cfg.motto || SCHOOL.motto;
  const logoUrl = cfg.logoUrl || "/logo.svg";
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
      const band = bands.find((b) => total >= b.minScore && total <= b.maxScore);
      if (band) {
        const g = band.grade.toUpperCase();
        const pill =
          g.startsWith("A") ? "g-a1" : g.startsWith("B") ? "g-b2" : g.startsWith("C") ? "g-c" : g.startsWith("D") ? "g-d" : g.startsWith("E") ? "g-e" : "g-f";
        return { grade: band.grade, remark: remark || band.remark, pill };
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

  const fullName = `${student.firstName} ${student.otherNames ?? ""} ${student.lastName}`
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

  const photoDoc = student.documents.find((d) =>
    /photo|passport|portrait|picture|image/i.test(d.label)
  );
  const photoUrl = photoDoc?.fileUrl || null;

  return (
    <>
      <style>{`
        .rc-page { max-width: 820px; margin: 0 auto; background: #fffefb; border: 1px solid #dedacd; box-shadow: 0 4px 24px rgba(26,58,110,.06); overflow: hidden; }
        .rc-header { background: linear-gradient(160deg,#0f2748 0%,#1a3a6e 100%); color:#fff; padding:1.25rem 1.25rem 1.1rem; position:relative; }
        .rc-header::after { content:""; position:absolute; bottom:0; left:0; right:0; height:4px; background:linear-gradient(90deg,#c9a227,#e8d48b,#c9a227); }
        .rc-header-row { display:flex; align-items:flex-start; gap:0.85rem; }
        .rc-logo { width:72px; height:72px; flex-shrink:0; background:rgba(255,255,255,.12); border-radius:50%; padding:4px; object-fit:contain; }
        .rc-header-mid { flex:1; min-width:0; text-align:left; }
        .rc-school { font-family:var(--font-fraunces),Georgia,serif; font-size:1.25rem; font-weight:600; letter-spacing:-.01em; line-height:1.2; }
        .rc-motto { font-size:.7rem; opacity:.85; font-style:italic; margin-top:2px; }
        .rc-contact { font-size:.62rem; opacity:.7; margin-top:.4rem; line-height:1.35; }
        .rc-doc-title { margin-top:.65rem; font-size:.68rem; font-weight:600; letter-spacing:.16em; text-transform:uppercase; color:#c9a227; text-align:center; }
        .rc-photo-box { width:78px; height:92px; flex-shrink:0; border:2px solid rgba(255,255,255,.45); background:rgba(255,255,255,.08); border-radius:2px; overflow:hidden; display:flex; align-items:center; justify-content:center; }
        .rc-photo-box img { width:100%; height:100%; object-fit:cover; }
        .rc-photo-placeholder { font-size:.55rem; text-align:center; color:rgba(255,255,255,.55); line-height:1.3; padding:0.25rem; }
        .rc-meta { display:grid; grid-template-columns:1fr 1fr; gap:.35rem 1.5rem; padding:1rem 1.5rem; border-bottom:1px solid #dedacd; font-size:.8125rem; background:#faf8f3; }
        .rc-meta-item { display:flex; gap:.4rem; }
        .rc-meta-item > span:first-child { color:#4a5265; min-width:5.5rem; flex-shrink:0; }
        .rc-section { padding:1.1rem 1.5rem .25rem; }
        .rc-section-title { font-family:var(--font-fraunces),Georgia,serif; font-size:.95rem; font-weight:600; color:#1a3a6e; border-bottom:2px solid #1a3a6e; padding-bottom:.3rem; margin-bottom:.75rem; }
        .rc-table-wrap { overflow-x:auto; -webkit-overflow-scrolling:touch; }
        table.rc-scores { width:100%; border-collapse:collapse; font-size:.78rem; min-width:560px; }
        table.rc-scores thead th { background:#1a3a6e; color:#fff; font-weight:600; text-align:center; padding:.5rem .4rem; white-space:nowrap; }
        table.rc-scores thead th:first-child { text-align:left; padding-left:.6rem; }
        table.rc-scores tbody td { border-bottom:1px solid #dedacd; padding:.4rem; text-align:center; }
        table.rc-scores tbody td:first-child { text-align:left; padding-left:.6rem; font-weight:500; }
        table.rc-scores tbody tr:nth-child(even) { background:#f9f7f1; }
        .grade-pill { display:inline-block; font-size:.68rem; font-weight:700; padding:.1rem .4rem; border-radius:3px; }
        .g-a1 { background:#d4edda; color:#155724; }
        .g-b2 { background:#cce5ff; color:#004085; }
        .g-c { background:#fff3cd; color:#856404; }
        .g-d { background:#f8d7da; color:#721c24; }
        .g-e { background:#e2e3e5; color:#383d41; }
        .g-f { background:#f5c6cb; color:#721c24; }
        .rc-summary { display:grid; grid-template-columns:repeat(4,1fr); gap:.75rem; padding:.9rem 1.5rem; background:#faf8f3; border-top:1px solid #dedacd; border-bottom:1px solid #dedacd; }
        .rc-summary-item { text-align:center; }
        .rc-summary-item .label { font-size:.65rem; text-transform:uppercase; letter-spacing:.06em; color:#4a5265; margin-bottom:.15rem; }
        .rc-summary-item .value { font-family:var(--font-fraunces),Georgia,serif; font-size:1.25rem; font-weight:600; color:#1a3a6e; font-variant-numeric:tabular-nums; }
        .rc-summary-item .sub { font-size:.65rem; color:#4a5265; }
        .rc-domains { display:grid; grid-template-columns:1fr 1fr; gap:1.25rem; padding:1rem 1.5rem; }
        .rc-domain-card { border:1px solid #dedacd; border-radius:4px; overflow:hidden; }
        .rc-domain-card h3 { background:#1a3a6e; color:#fff; font-size:.72rem; font-weight:600; letter-spacing:.06em; text-transform:uppercase; padding:.4rem .7rem; }
        .rc-domain-list { padding:.5rem .7rem; font-size:.75rem; }
        .rc-domain-row { display:flex; justify-content:space-between; align-items:center; padding:.28rem 0; border-bottom:1px solid #f0ede3; }
        .rc-domain-row:last-child { border-bottom:none; }
        .rc-rating { display:flex; gap:3px; }
        .rc-dot { width:14px; height:14px; border-radius:50%; border:1.5px solid #dedacd; font-size:.55rem; display:flex; align-items:center; justify-content:center; color:transparent; }
        .rc-dot.on { background:#c9a227; border-color:#c9a227; color:#fff; font-weight:700; }
        .rc-rating-key { font-size:.65rem; color:#4a5265; padding:.5rem 1.5rem .25rem; line-height:1.5; }
        .rc-attendance { display:grid; grid-template-columns:repeat(4,1fr); gap:.5rem; padding:.75rem 1.5rem 1rem; font-size:.78rem; }
        .rc-att-item span:first-child { color:#4a5265; display:block; font-size:.65rem; }
        .rc-remark-box { border:1px solid #dedacd; border-radius:4px; padding:.75rem 1rem; margin-bottom:.75rem; font-size:.8rem; background:#faf8f3; }
        .rc-remark-box .who { font-size:.65rem; font-weight:600; text-transform:uppercase; letter-spacing:.05em; color:#1a3a6e; margin-bottom:.3rem; }
        .rc-remark-box .sign { margin-top:.6rem; font-size:.7rem; color:#4a5265; border-top:1px dashed #dedacd; padding-top:.4rem; display:flex; justify-content:space-between; }
        .rc-grade-scale { padding:.5rem 1.5rem 1rem; font-size:.7rem; }
        .rc-grade-scale table { width:100%; border-collapse:collapse; }
        .rc-grade-scale td { padding:.2rem .4rem; border-bottom:1px solid #f0ede3; }
        .rc-grade-scale td:first-child { font-weight:700; width:2.5rem; color:#1a3a6e; }
        .rc-footer { background:#0f2748; color:rgba(255,255,255,.7); text-align:center; padding:.75rem 1.5rem; font-size:.65rem; }
        .rc-footer strong { color:#c9a227; }
        @media print {
          body { background:white !important; }
          .no-print { display:none !important; }
          .rc-page { box-shadow:none; border:none; max-width:100%; }
        }
        @media (max-width:640px) {
          .rc-meta { grid-template-columns:1fr; }
          .rc-summary { grid-template-columns:1fr 1fr; }
          .rc-domains { grid-template-columns:1fr; }
          .rc-attendance { grid-template-columns:1fr 1fr; }
          .rc-school { font-size:1.05rem; }
          .rc-logo { width:56px; height:56px; }
          .rc-photo-box { width:64px; height:76px; }
          .rc-header-row { gap:0.5rem; }
        }
      `}</style>

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
              <span>Session</span>
              <strong>{sessionLabel}</strong>
            </div>
            <div className="rc-meta-item">
              <span>Position in Class</span>
              <strong>—</strong>
            </div>
          </div>

          <section className="rc-section">
            <h2 className="rc-section-title">Cognitive Domain</h2>
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

          <div className="rc-domains">
            <DomainCard title="Psychomotor Domain" items={PSYCHOMOTOR} />
            <DomainCard title="Affective Domain" items={AFFECTIVE} />
          </div>
          <p className="rc-rating-key">
            <strong>Rating key:</strong> 5 = Excellent · 4 = High · 3 = Acceptable · 2 = Minimal · 1 =
            Needs improvement
            <span className="block mt-1 opacity-70">
              (Fill ratings in office records — shown blank until domain scoring is enabled.)
            </span>
          </p>

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

function DomainCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rc-domain-card">
      <h3>{title}</h3>
      <div className="rc-domain-list">
        {items.map((label) => (
          <div key={label} className="rc-domain-row">
            <span>{label}</span>
            <div className="rc-rating" aria-label={`${label} rating blank`}>
              {[5, 4, 3, 2, 1].map((n) => (
                <span key={n} className="rc-dot">
                  {n}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
