import { z } from "zod";
import {
  betaEventsSchema,
  cleanText,
  feedbackSchema,
  normalizedScoresSchema,
  profileCodeSchema,
  submissionProofFields,
} from "./submissionSchemas";

export const premiumOrderSchema = z
  .object({
    name: cleanText(80),
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((value) => value.toLowerCase()),
    profileCode: profileCodeSchema,
    normalizedScores: normalizedScoresSchema,
    feedback: feedbackSchema.optional(),
    betaEvents: betaEventsSchema,
    ...submissionProofFields,
  })
  .strict();

export type PremiumOrderPayload = z.infer<typeof premiumOrderSchema>;

export function validatePremiumOrder(
  body: unknown,
):
  | { readonly success: true; readonly data: PremiumOrderPayload }
  | { readonly success: false; readonly error: string } {
  const result = premiumOrderSchema.safeParse(body);
  if (!result.success) {
    return { success: false, error: "Invalid request payload." };
  }
  return { success: true, data: result.data };
}
