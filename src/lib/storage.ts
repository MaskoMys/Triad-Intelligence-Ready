import { z } from "zod";
import { cleanSingleLine } from "./text";
import {
  MAX_HISTORY_ITEMS,
  PROFILE_CODES,
  STORAGE_KEY,
  TRAIT_KEYS,
  consolidateMacroScores,
  generateProfileCode,
  getArchetype,
  type AssessmentResult,
  type TraitScores,
} from "@/domain/assessment";

const rawScoreSchema = z.object(
  Object.fromEntries(
    TRAIT_KEYS.map((trait) => [trait, z.number().finite().min(-1000).max(1000)]),
  ) as Record<(typeof TRAIT_KEYS)[number], z.ZodNumber>,
);

const normalizedScoreSchema = z.object(
  Object.fromEntries(
    TRAIT_KEYS.map((trait) => [trait, z.number().finite().min(0).max(100)]),
  ) as Record<(typeof TRAIT_KEYS)[number], z.ZodNumber>,
);

const feedbackSchema = z
  .object({
    accuracyRating: z.number().int().min(1).max(5).optional(),
    mostTrue: z.string().max(1000).optional(),
    mostWrong: z.string().max(1000).optional(),
    wouldShare: z.boolean().optional(),
    wouldPayDeeper: z.boolean().optional(),
    pmfResponse: z
      .enum([
        "very-disappointed",
        "somewhat-disappointed",
        "not-disappointed",
        "would-not-use-again",
      ])
      .optional(),
    idealUser: z.string().max(500).optional(),
  })
  .strict();

const storedResultSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: z.string().min(1).max(100),
    timestamp: z.string().datetime(),
    userName: z.string().min(1).max(50),
    rawScores: rawScoreSchema,
    normalizedScores: normalizedScoreSchema,
    macroScores: z
      .object({
        imagination: z.number().min(0).max(100),
        intuition: z.number().min(0).max(100),
        judgment: z.number().min(0).max(100),
      })
      .strict(),
    profileCode: z.enum(PROFILE_CODES),
    feedback: feedbackSchema.optional(),
  })
  .strict();

const historySchema = z.array(storedResultSchema).max(MAX_HISTORY_ITEMS);

type StoredAssessmentResult = z.infer<typeof storedResultSchema>;

function getStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function normalizeName(name: string): string {
  return cleanSingleLine(name).slice(0, 50) || "Anonymous explorer";
}

function toStoredResult(result: AssessmentResult): StoredAssessmentResult {
  return {
    schemaVersion: 1,
    id: result.id,
    timestamp: result.timestamp,
    userName: normalizeName(result.userName),
    rawScores: result.rawScores,
    normalizedScores: result.normalizedScores,
    macroScores: result.macroScores,
    profileCode: result.profileCode,
    ...(result.feedback ? { feedback: result.feedback } : {}),
  };
}

function hydrateResult(stored: StoredAssessmentResult): AssessmentResult {
  const normalizedScores: TraitScores = stored.normalizedScores;
  const profileCode = generateProfileCode(normalizedScores);
  return {
    schemaVersion: 1,
    id: stored.id,
    timestamp: stored.timestamp,
    userName: normalizeName(stored.userName),
    rawScores: stored.rawScores,
    normalizedScores,
    macroScores: consolidateMacroScores(normalizedScores),
    profileCode,
    archetype: getArchetype(profileCode, normalizedScores),
    ...(stored.feedback ? { feedback: stored.feedback } : {}),
  };
}

export function loadAssessmentHistory(): AssessmentResult[] {
  const storage = getStorage();
  if (!storage) return [];

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    const result = historySchema.safeParse(parsed);
    if (!result.success) {
      storage.removeItem(STORAGE_KEY);
      return [];
    }

    return result.data.map(hydrateResult);
  } catch {
    return [];
  }
}

export function saveAssessmentHistory(results: readonly AssessmentResult[]): boolean {
  const storage = getStorage();
  if (!storage) return false;

  try {
    const bounded = results.slice(0, MAX_HISTORY_ITEMS).map(toStoredResult);
    historySchema.parse(bounded);
    storage.setItem(STORAGE_KEY, JSON.stringify(bounded));
    return true;
  } catch {
    return false;
  }
}

export function deleteAssessmentResult(id: string): AssessmentResult[] {
  const updated = loadAssessmentHistory().filter((result) => result.id !== id);
  saveAssessmentHistory(updated);
  return updated;
}

export function clearAssessmentHistory(): void {
  getStorage()?.removeItem(STORAGE_KEY);
}

export function createHistoryExport(results: readonly AssessmentResult[]): string {
  const exportData = {
    product: "Tri-Ad Cognitive Archetype Mapper",
    exportedAt: new Date().toISOString(),
    disclaimer:
      "Experimental self-reflection data. Not a clinical, educational, employment, medical, financial, or psychological diagnostic record.",
    results: results.map(toStoredResult),
  };

  return JSON.stringify(exportData, null, 2);
}
