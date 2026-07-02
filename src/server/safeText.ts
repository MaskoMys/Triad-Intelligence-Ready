import { cleanSingleLine } from "@/lib/text";

function primitiveToString(value: unknown): string {
  if (typeof value === "string") return value;
  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }
  return "";
}

export function escapeHtml(value: unknown): string {
  return primitiveToString(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function sanitizeSubjectPart(
  value: unknown,
  maximumLength = 80,
): string {
  return cleanSingleLine(primitiveToString(value)).slice(0, maximumLength);
}
