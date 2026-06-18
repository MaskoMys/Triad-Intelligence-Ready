import type { TraitKey } from "./types";

export const ASSESSMENT_DISCLAIMER =
  "Tri-Ad is an experimental self-reflection tool. It is not a clinical, educational, employment, financial, medical, or psychological diagnostic instrument.";

export const TRAIT_LABELS: Record<TraitKey, string> = {
  creativity: "Creativity",
  innovation: "Innovation",
  physical: "Physical awareness",
  metaphysical: "Symbolic sensitivity",
  discernment: "Discernment",
  logical: "Logical structure",
  emotional: "Emotional context",
  predictive: "Predictive thinking",
};

export const TRAIT_SHORT_LABELS: Record<TraitKey, string> = {
  creativity: "C",
  innovation: "I",
  physical: "P",
  metaphysical: "M",
  discernment: "D",
  logical: "L",
  emotional: "E",
  predictive: "R",
};

export const TRAIT_DESCRIPTIONS: Record<TraitKey, string> = {
  creativity: "Preference for generating original, symbolic, or abstract possibilities.",
  innovation: "Preference for adapting and improving existing systems into practical solutions.",
  physical: "Attention to sensory evidence, body language, environments, and direct observation.",
  metaphysical: "Attention to symbolism, dreams, meaning, and non-material interpretations.",
  discernment:
    "Tendency to test patterns against evidence, boundaries, and competing explanations.",
  logical: "Preference for consistency, rules, structured reasoning, and repeatable processes.",
  emotional: "Attention to human impact, relationships, values, and emotional resonance.",
  predictive: "Attention to temporal patterns, historical trends, and possible future outcomes.",
};

export const STORAGE_KEY = "triad.assessment-history.v1";
export const TELEMETRY_KEY = "triad.beta-events.v1";
export const MAX_HISTORY_ITEMS = 20;
