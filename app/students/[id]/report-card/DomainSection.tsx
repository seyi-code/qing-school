import { inferSchoolBand } from "@/lib/report-band";

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

export function DomainSection({
  classLabel,
  domainsMode = "auto",
}: {
  classLabel: string;
  domainsMode?: "auto" | "primary" | "secondary" | "hidden";
}) {
  const band = inferSchoolBand(classLabel);
  const show =
    domainsMode === "primary"
      ? true
      : domainsMode === "secondary" || domainsMode === "hidden"
        ? false
        : band === "primary";

  if (!show) return null;

  return (
    <>
      <div className="rc-domains">
        <DomainCard title="Psychomotor Domain" items={PSYCHOMOTOR} />
        <DomainCard title="Affective Domain" items={AFFECTIVE} />
      </div>
      <p className="rc-rating-key">
        <strong>Rating key:</strong> 5 = Excellent · 4 = High · 3 = Acceptable · 2 = Minimal · 1 =
        Needs improvement
        <span className="block mt-1 opacity-70">
          Nursery / primary only. Secondary reports focus on subjects.
        </span>
      </p>
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
