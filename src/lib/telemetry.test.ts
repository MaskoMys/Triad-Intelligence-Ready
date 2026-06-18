import { beforeEach, describe, expect, it, vi } from "vitest";
import { TELEMETRY_KEY } from "@/domain/assessment";
import {
  BETA_EVENT_NAMES,
  clearBetaEvents,
  getBetaEventSummary,
  trackBetaEvent,
} from "./telemetry";

describe("local beta telemetry", () => {
  beforeEach(() => localStorage.clear());

  it("starts empty and increments only known event counters", () => {
    expect(getBetaEventSummary()).toEqual({});

    trackBetaEvent("assessment_started");
    trackBetaEvent("assessment_started");
    trackBetaEvent("results_viewed");

    expect(getBetaEventSummary()).toEqual({
      assessment_started: 2,
      results_viewed: 1,
    });
  });

  it("ignores corrupt, unknown, negative, and non-integer stored values", () => {
    localStorage.setItem(
      TELEMETRY_KEY,
      JSON.stringify({
        landing_viewed: 3,
        results_viewed: -1,
        pdf_downloaded: 2.5,
        unknown_event: 99,
      }),
    );

    expect(getBetaEventSummary()).toEqual({ landing_viewed: 3 });
    localStorage.setItem(TELEMETRY_KEY, "not-json");
    expect(getBetaEventSummary()).toEqual({});
    localStorage.setItem(TELEMETRY_KEY, "[]");
    expect(getBetaEventSummary()).toEqual({});
  });

  it("clears all local event counters", () => {
    trackBetaEvent("landing_viewed");
    clearBetaEvents();
    expect(localStorage.getItem(TELEMETRY_KEY)).toBeNull();
  });

  it("treats storage failures as best-effort instead of crashing", () => {
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked");
    });
    expect(getBetaEventSummary()).toEqual({});
    getItem.mockRestore();

    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("quota");
    });
    expect(() => trackBetaEvent("landing_viewed")).not.toThrow();
    setItem.mockRestore();
  });

  it("publishes a stable allow-list of event names", () => {
    expect(new Set(BETA_EVENT_NAMES).size).toBe(BETA_EVENT_NAMES.length);
    expect(BETA_EVENT_NAMES).toContain("feedback_submitted");
    expect(BETA_EVENT_NAMES).toContain("premium_order_submitted");
  });
});
