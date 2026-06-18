import { z } from "zod";
import { PROFILE_CODES, TRAIT_KEYS } from "@/domain/assessment";
import { BETA_EVENT_NAMES } from "@/lib/telemetry";
import { cleanSingleLine, stripControlCharacters } from "@/lib/text";

export const cleanText = (maximum: number) =>
  z.string().trim().min(1).max(maximum).transform(cleanSingleLine);

const optionalFeedbackText = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .transform((value) => stripControlCharacters(value, true).trim())
    .optional();

export const normalizedScoresSchema = z
  .object(
    Object.fromEntries(
      TRAIT_KEYS.map((trait) => [trait, z.number().finite().min(0).max(100)]),
    ) as Record<(typeof TRAIT_KEYS)[number], z.ZodNumber>,
  )
  .strict();

export const feedbackSchema = z
  .object({
    accuracyRating: z.number().int().min(1).max(5).optional(),
    mostTrue: optionalFeedbackText(1000),
    mostWrong: optionalFeedbackText(1000),
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
    idealUser: optionalFeedbackText(500),
  })
  .strict();

export const betaEventsSchema = z
  .object(
    Object.fromEntries(
      BETA_EVENT_NAMES.map((eventName) => [
        eventName,
        z.number().int().min(0).max(1000).optional(),
      ]),
    ) as Record<(typeof BETA_EVENT_NAMES)[number], z.ZodOptional<z.ZodNumber>>,
  )
  .strict()
  .optional();

export const submissionProofFields = {
  inviteCode: z.string().trim().min(1).max(128),
  turnstileToken: z.string().trim().max(2048).optional(),
  formStartedAt: z.number().int().positive(),
  website: z.string().max(0).optional(),
} as const;

export const profileCodeSchema = z.enum(PROFILE_CODES);
