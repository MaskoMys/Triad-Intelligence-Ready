import { describe, expect, it } from "vitest";
import {
  DEFAULT_TRAIT_BOUNDS,
  DEFAULT_TRAIT_EXPECTATIONS,
  PROFILE_CODES,
  TRAIT_KEYS,
  computeRawUserScores,
  generateProfileCode,
  normalizeScores,
  questions,
  scoreAssessment,
  validateResponses,
  type ResponseMap,
  type TraitScores,
  type TraitWeights,
} from "./index";

describe("assessment scoring", () => {
  it("defines 30 unique, answerable questions", () => {
    expect(questions).toHaveLength(30);
    expect(new Set(questions.map((question) => question.id)).size).toBe(30);
    for (const question of questions) {
      expect(question.options.length).toBeGreaterThanOrEqual(2);
      for (const option of question.options) {
        expect(option.text.trim()).not.toBe("");
        expect(
          Object.keys(option.weights).every((key) =>
            TRAIT_KEYS.includes(key as never),
          ),
        ).toBe(true);
      }
    }
  });

  it("rejects incomplete response sets", () => {
    const result = validateResponses(questions, {});
    expect(result.valid).toBe(false);
    expect(result.missingQuestionIds).toHaveLength(30);
    expect(() => scoreAssessment({})).toThrow(/incomplete/i);
  });

  it("produces a deterministic fixture result", () => {
    const responses: ResponseMap = Object.fromEntries(
      questions.map((question) => [question.id, 0]),
    );
    const first = scoreAssessment(responses);
    const second = scoreAssessment(responses);
    expect(second).toEqual(first);
    expect(PROFILE_CODES).toContain(first.profileCode);
    expect(first.archetype.baseCode).toBe(first.profileCode);
  });

  it("keeps normalized scores in the inclusive 0–100 range", () => {
    const minimums = Object.fromEntries(
      TRAIT_KEYS.map((trait) => [trait, DEFAULT_TRAIT_BOUNDS[trait].min]),
    ) as TraitWeights;
    const maximums = Object.fromEntries(
      TRAIT_KEYS.map((trait) => [trait, DEFAULT_TRAIT_BOUNDS[trait].max]),
    ) as TraitWeights;

    for (const normalized of [
      normalizeScores(
        minimums,
        DEFAULT_TRAIT_BOUNDS,
        DEFAULT_TRAIT_EXPECTATIONS,
      ),
      normalizeScores(
        maximums,
        DEFAULT_TRAIT_BOUNDS,
        DEFAULT_TRAIT_EXPECTATIONS,
      ),
    ]) {
      for (const trait of TRAIT_KEYS) {
        expect(normalized[trait]).toBeGreaterThanOrEqual(0);
        expect(normalized[trait]).toBeLessThanOrEqual(100);
      }
    }
  });

  it("generates every valid code for purpose-built score records", () => {
    const codes = new Set<string>();
    for (const imagination of ["C", "I"] as const) {
      for (const intuition of ["D", "P", "M"] as const) {
        for (const judgment of ["L", "R", "E"] as const) {
          const scores: TraitScores = {
            creativity: imagination === "C" ? 90 : 20,
            innovation: imagination === "I" ? 90 : 20,
            discernment: intuition === "D" ? 90 : 20,
            physical: intuition === "P" ? 90 : 20,
            metaphysical: intuition === "M" ? 90 : 20,
            logical: judgment === "L" ? 90 : 20,
            predictive: judgment === "R" ? 90 : 20,
            emotional: judgment === "E" ? 90 : 20,
          };
          codes.add(generateProfileCode(scores));
        }
      }
    }
    expect([...codes].sort()).toEqual([...PROFILE_CODES].sort());
  });

  it("ignores invalid selected option indexes when calculating raw scores", () => {
    const raw = computeRawUserScores(questions, { [questions[0]!.id]: 999 });
    for (const trait of TRAIT_KEYS) expect(raw[trait]).toBe(0);
  });
});
