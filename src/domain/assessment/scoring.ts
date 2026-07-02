import { getArchetype } from "./archetypes";
import { questions } from "./questions";
import {
  TRAIT_KEYS,
  type MacroScores,
  type ProfileCode,
  type Question,
  type ResponseMap,
  type ScoringResult,
  type TraitBounds,
  type TraitKey,
  type TraitScores,
  type TraitWeights,
} from "./types";

function createZeroTraitRecord(): TraitWeights {
  return Object.fromEntries(
    TRAIT_KEYS.map((trait) => [trait, 0]),
  ) as TraitWeights;
}

export function computeTraitExpectations(
  questionList: readonly Question[],
): TraitWeights {
  const expectations = createZeroTraitRecord();

  for (const question of questionList) {
    if (question.options.length === 0) continue;

    for (const trait of TRAIT_KEYS) {
      const optionTotal = question.options.reduce(
        (sum, option) => sum + (option.weights[trait] ?? 0),
        0,
      );
      expectations[trait] += optionTotal / question.options.length;
    }
  }

  return expectations;
}

export function computeTraitBounds(
  questionList: readonly Question[],
): TraitBounds {
  return Object.fromEntries(
    TRAIT_KEYS.map((trait) => {
      let minimum = 0;
      let maximum = 0;

      for (const question of questionList) {
        const weights = question.options.map(
          (option) => option.weights[trait] ?? 0,
        );
        minimum += weights.length > 0 ? Math.min(...weights) : 0;
        maximum += weights.length > 0 ? Math.max(...weights) : 0;
      }

      return [trait, { min: minimum, max: maximum }];
    }),
  ) as TraitBounds;
}

export function validateResponses(
  questionList: readonly Question[],
  responses: ResponseMap,
): { readonly valid: boolean; readonly missingQuestionIds: readonly number[] } {
  const missingQuestionIds = questionList
    .filter((question) => {
      const selectedIndex = responses[question.id];
      return (
        selectedIndex === undefined ||
        !Number.isInteger(selectedIndex) ||
        selectedIndex < 0 ||
        selectedIndex >= question.options.length
      );
    })
    .map((question) => question.id);

  return { valid: missingQuestionIds.length === 0, missingQuestionIds };
}

export function computeRawUserScores(
  questionList: readonly Question[],
  responses: ResponseMap,
): TraitWeights {
  const rawScores = createZeroTraitRecord();

  for (const question of questionList) {
    const selectedIndex = responses[question.id];
    const selectedOption =
      selectedIndex === undefined ? undefined : question.options[selectedIndex];

    if (!selectedOption) continue;

    for (const trait of TRAIT_KEYS) {
      rawScores[trait] += selectedOption.weights[trait] ?? 0;
    }
  }

  return rawScores;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function normalizeScores(
  rawScores: TraitWeights,
  bounds: TraitBounds,
  expectations: TraitWeights,
): TraitScores {
  return Object.fromEntries(
    TRAIT_KEYS.map((trait) => {
      const { min, max } = bounds[trait];
      const raw = rawScores[trait];
      const expected = expectations[trait];

      if (max === min) return [trait, 50];
      if (raw <= expected) {
        const lowerSpan = expected - min;
        const value = lowerSpan <= 0 ? 50 : ((raw - min) / lowerSpan) * 50;
        return [trait, Math.round(clamp(value, 0, 50) * 10) / 10];
      }

      const upperSpan = max - expected;
      const value =
        upperSpan <= 0 ? 50 : 50 + ((raw - expected) / upperSpan) * 50;
      return [trait, Math.round(clamp(value, 50, 100) * 10) / 10];
    }),
  ) as TraitScores;
}

export function consolidateMacroScores(scores: TraitScores): MacroScores {
  const roundOneDecimal = (value: number): number =>
    Math.round(value * 10) / 10;

  return {
    imagination: roundOneDecimal((scores.creativity + scores.innovation) / 2),
    intuition: roundOneDecimal(
      (scores.physical + scores.metaphysical + scores.discernment) / 3,
    ),
    judgment: roundOneDecimal(
      (scores.logical + scores.emotional + scores.predictive) / 3,
    ),
  };
}

function highestTrait<T extends readonly TraitKey[]>(
  scores: TraitScores,
  candidates: T,
): T[number] {
  return candidates.reduce((best, candidate) =>
    scores[candidate] > scores[best] ? candidate : best,
  );
}

export function generateProfileCode(scores: TraitScores): ProfileCode {
  const imagination = scores.creativity > scores.innovation ? "C" : "I";
  const intuitionTrait = highestTrait(scores, [
    "discernment",
    "physical",
    "metaphysical",
  ]);
  const judgmentTrait = highestTrait(scores, [
    "logical",
    "predictive",
    "emotional",
  ]);

  const intuition = {
    discernment: "D",
    physical: "P",
    metaphysical: "M",
  }[intuitionTrait];

  const judgment = {
    logical: "L",
    predictive: "R",
    emotional: "E",
  }[judgmentTrait];

  return `${imagination}${intuition}${judgment}` as ProfileCode;
}

export const DEFAULT_TRAIT_BOUNDS = computeTraitBounds(questions);
export const DEFAULT_TRAIT_EXPECTATIONS = computeTraitExpectations(questions);

export function scoreAssessment(responses: ResponseMap): ScoringResult {
  const validation = validateResponses(questions, responses);
  if (!validation.valid) {
    throw new Error(
      `Assessment is incomplete. Missing or invalid responses: ${validation.missingQuestionIds.join(", ")}`,
    );
  }

  const rawScores = computeRawUserScores(questions, responses);
  const normalizedScores = normalizeScores(
    rawScores,
    DEFAULT_TRAIT_BOUNDS,
    DEFAULT_TRAIT_EXPECTATIONS,
  );
  const macroScores = consolidateMacroScores(normalizedScores);
  const profileCode = generateProfileCode(normalizedScores);
  const archetype = getArchetype(profileCode, normalizedScores);

  return { rawScores, normalizedScores, macroScores, profileCode, archetype };
}
