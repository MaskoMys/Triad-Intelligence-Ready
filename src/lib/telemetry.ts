import { TELEMETRY_KEY } from "@/domain/assessment";

export const BETA_EVENT_NAMES = [
  "landing_viewed",
  "assessment_started",
  "assessment_completed",
  "results_viewed",
  "pdf_downloaded",
  "share_clicked",
  "result_exported",
  "history_exported",
  "feedback_saved",
  "feedback_submitted",
  "premium_modal_opened",
  "premium_order_submitted",
] as const;

export type BetaEventName = (typeof BETA_EVENT_NAMES)[number];
export type BetaEventSummary = Partial<Record<BetaEventName, number>>;

function getStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function getBetaEventSummary(): BetaEventSummary {
  const storage = getStorage();
  if (!storage) return {};

  try {
    const parsed = JSON.parse(
      storage.getItem(TELEMETRY_KEY) ?? "{}",
    ) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return {};

    const source = parsed as Record<string, unknown>;
    return Object.fromEntries(
      BETA_EVENT_NAMES.flatMap((eventName) => {
        const count = source[eventName];
        return typeof count === "number" &&
          Number.isInteger(count) &&
          count >= 0
          ? [[eventName, count]]
          : [];
      }),
    );
  } catch {
    return {};
  }
}

export function trackBetaEvent(eventName: BetaEventName): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    const summary = getBetaEventSummary();
    summary[eventName] = (summary[eventName] ?? 0) + 1;
    storage.setItem(TELEMETRY_KEY, JSON.stringify(summary));
  } catch {
    // Analytics are intentionally best-effort and local-only.
  }
}

export function clearBetaEvents(): void {
  getStorage()?.removeItem(TELEMETRY_KEY);
}
