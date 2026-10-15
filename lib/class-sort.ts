/** Natural school-level ordering: Nursery → Primary → JSS → SSS, then arm name. */

export function classLevelRank(name: string): number {
  const n = name.toUpperCase().replace(/\s+/g, " ").trim();
  const m = n.match(
    /^(NURSERY|NUR|KG|KINDERGARTEN|PRIMARY|PRY|BASIC|JSS|JS|JUNIOR|SSS|SS|SENIOR)\s*(\d+)?/
  );
  if (!m) return 900 + (n.charCodeAt(0) || 0);

  const band = m[1];
  const num = m[2] ? parseInt(m[2], 10) : 0;

  let bandBase = 400;
  if (/^NUR|^KG|^KIND/.test(band)) bandBase = 0;
  else if (/^PRY|^PRIMARY|^BASIC/.test(band)) bandBase = 100;
  else if (/^JSS|^JS|^JUNIOR/.test(band)) bandBase = 200;
  else if (/^SSS|^SS|^SENIOR/.test(band)) bandBase = 300;

  return bandBase + num;
}

export function compareClassNames(a: string, b: string): number {
  const ra = classLevelRank(a);
  const rb = classLevelRank(b);
  if (ra !== rb) return ra - rb;
  return a.localeCompare(b, undefined, { sensitivity: "base", numeric: true });
}

/** Sort arms with className + arm name (e.g. "JSS 1 A"). */
export function compareArmLabels(a: string, b: string): number {
  return compareClassNames(a, b);
}
