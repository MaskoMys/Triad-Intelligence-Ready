import { describe, expect, it } from "vitest";
import { normalizeBetaEvents } from "./betaEvents";

describe("beta event normalization", () => {
  it("keeps only non-negative integer counts", () => {
    expect(
      normalizeBetaEvents({
        landing_viewed: 2,
        assessment_started: -1,
        assessment_completed: 1.5,
      }),
    ).toEqual({ landing_viewed: 2 });
  });

  it("returns undefined when no summary is supplied", () => {
    expect(normalizeBetaEvents(undefined)).toBeUndefined();
  });
});
