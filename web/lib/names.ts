/**
 * The given name from a stored full name. Titles ("Dr. Sarah Chen") are
 * stripped first, so the greeting reads "Sarah" rather than the surname a
 * naive split would hand back.
 */
export function firstName(fullName: string): string {
  const stripped = fullName.replace(/^(Dr|Prof|Mr|Ms|Mrs|Mx)\.?\s+/i, "").trim();
  return stripped.split(/\s+/)[0] || fullName;
}
