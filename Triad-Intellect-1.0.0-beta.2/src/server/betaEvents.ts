import type { BetaEventSummary } from "@/lib/telemetry";

export function normalizeBetaEvents(
  input: Partial<Record<string, number>> | undefined,
): BetaEventSummary | undefined {
  if (!input) return undefined;
  return Object.fromEntries(
    Object.entries(input).filter(
      (entry): entry is [string, number] =>
        typeof entry[1] === "number" && Number.isInteger(entry[1]) && entry[1] >= 0,
    ),
  );
}
