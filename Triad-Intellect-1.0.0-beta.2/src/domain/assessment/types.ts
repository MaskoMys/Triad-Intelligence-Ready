export const TRAIT_KEYS = [
  "creativity",
  "innovation",
  "physical",
  "metaphysical",
  "discernment",
  "logical",
  "emotional",
  "predictive",
] as const;

export type TraitKey = (typeof TRAIT_KEYS)[number];
export type TraitScores = Record<TraitKey, number>;
export type TraitWeights = Record<TraitKey, number>;

export const PROFILE_CODES = [
  "CDL",
  "CDR",
  "CDE",
  "CPL",
  "CPR",
  "CPE",
  "CML",
  "CMR",
  "CME",
  "IDL",
  "IDR",
  "IDE",
  "IPL",
  "IPR",
  "IPE",
  "IML",
  "IMR",
  "IME",
] as const;

export type ProfileCode = (typeof PROFILE_CODES)[number];
export type ProfileExtensionCode = "-F" | "-A";

export interface QuestionOption {
  readonly text: string;
  readonly weights: Partial<TraitWeights>;
}

export interface Question {
  readonly id: number;
  readonly text: string;
  readonly scenario: string;
  readonly options: readonly QuestionOption[];
}

export interface TraitBound {
  readonly min: number;
  readonly max: number;
}

export type TraitBounds = Record<TraitKey, TraitBound>;
export type ResponseMap = Record<number, number>;

export interface MacroScores {
  readonly imagination: number;
  readonly intuition: number;
  readonly judgment: number;
}

export interface ArchetypeExtension {
  readonly code: ProfileExtensionCode;
  readonly name: "Fluid" | "Anchored";
  readonly description: string;
}

export interface ArchetypeDetails {
  readonly code: string;
  readonly baseCode: ProfileCode;
  readonly name: string;
  readonly tagline: string;
  readonly description: string;
  readonly strengths: readonly string[];
  readonly challenges: readonly string[];
  readonly careerPaths: readonly string[];
  readonly extension: ArchetypeExtension;
}

export type PmfResponse =
  | "very-disappointed"
  | "somewhat-disappointed"
  | "not-disappointed"
  | "would-not-use-again";

export interface BetaFeedback {
  readonly accuracyRating?: number | undefined;
  readonly mostTrue?: string | undefined;
  readonly mostWrong?: string | undefined;
  readonly wouldShare?: boolean | undefined;
  readonly wouldPayDeeper?: boolean | undefined;
  readonly pmfResponse?: PmfResponse | undefined;
  readonly idealUser?: string | undefined;
}

export interface AssessmentResult {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly timestamp: string;
  readonly userName: string;
  readonly rawScores: TraitWeights;
  readonly normalizedScores: TraitScores;
  readonly macroScores: MacroScores;
  readonly profileCode: ProfileCode;
  readonly archetype: ArchetypeDetails;
  readonly feedback?: BetaFeedback;
}

export interface ScoringResult {
  readonly rawScores: TraitWeights;
  readonly normalizedScores: TraitScores;
  readonly macroScores: MacroScores;
  readonly profileCode: ProfileCode;
  readonly archetype: ArchetypeDetails;
}
