/** Infer nursery/primary vs secondary from class name (Nigerian naming). */
export function inferSchoolBand(classLabel: string): "primary" | "secondary" {
  const s = classLabel.toUpperCase();
  if (
    /\b(NUR|NURSERY|KG|KINDER|CRECHE|CR[EÈ]CHE|PRE[- ]?NUR|PRY|PRI|PRIMARY|BASIC\s*[1-6]|P[1-6]\b)/.test(
      s
    )
  ) {
    return "primary";
  }
  if (
    /\b(JSS|SSS|SS\s*[1-3]|JS\s*[1-3]|SECONDARY|SENIOR|JUNIOR|YEAR\s*(7|8|9|10|11|12))/.test(s)
  ) {
    return "secondary";
  }
  return "secondary";
}
