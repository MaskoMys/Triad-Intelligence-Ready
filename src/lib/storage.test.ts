import { beforeEach, describe, expect, it } from "vitest";
import {
  scoreAssessment,
  questions,
  type AssessmentResult,
} from "@/domain/assessment";
import {
  clearAssessmentHistory,
  createHistoryExport,
  loadAssessmentHistory,
  saveAssessmentHistory,
} from "./storage";

function fixture(): AssessmentResult {
  const responses = Object.fromEntries(
    questions.map((question) => [question.id, 0]),
  );
  return {
    schemaVersion: 1,
    id: "fixture-result",
    timestamp: "2026-06-18T00:00:00.000Z",
    userName: "A very long beta explorer name that remains privacy conscious",
    ...scoreAssessment(responses),
  };
}

describe("local assessment storage", () => {
  beforeEach(() => localStorage.clear());

  it("round-trips valid results and rebuilds archetype details", () => {
    expect(saveAssessmentHistory([fixture()])).toBe(true);
    const [loaded] = loadAssessmentHistory();
    expect(loaded?.id).toBe("fixture-result");
    expect(loaded?.archetype.baseCode).toBe(loaded?.profileCode);
    expect(loaded?.userName.length).toBeLessThanOrEqual(50);
  });

  it("recomputes derived values when local storage is tampered with", () => {
    const result = fixture();
    expect(saveAssessmentHistory([result])).toBe(true);
    const raw = JSON.parse(
      localStorage.getItem("triad.assessment-history.v1") ?? "[]",
    ) as Array<Record<string, unknown>>;
    const first = raw[0];
    if (!first) throw new Error("Missing fixture");
    first.profileCode = result.profileCode === "CDL" ? "IDE" : "CDL";
    first.macroScores = { imagination: 0, intuition: 0, judgment: 0 };
    localStorage.setItem("triad.assessment-history.v1", JSON.stringify(raw));

    const [loaded] = loadAssessmentHistory();
    expect(loaded?.profileCode).toBe(result.profileCode);
    expect(loaded?.macroScores).toEqual(result.macroScores);
  });

  it("drops malformed storage instead of trusting it", () => {
    localStorage.setItem(
      "triad.assessment-history.v1",
      JSON.stringify([{ forged: true }]),
    );
    expect(loadAssessmentHistory()).toEqual([]);
  });

  it("clears and exports without email fields", () => {
    const result = fixture();
    saveAssessmentHistory([result]);
    const exported = createHistoryExport([result]);
    expect(exported).not.toContain("userEmail");
    clearAssessmentHistory();
    expect(loadAssessmentHistory()).toEqual([]);
  });
});
