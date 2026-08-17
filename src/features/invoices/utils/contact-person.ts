export function buildContactPersonName(
  firstName?: string | null,
  lastName?: string | null,
): string {
  return [firstName, lastName]
    .map((part) => (part == null ? "" : String(part).trim()))
    .filter(Boolean)
    .join(" ");
}
