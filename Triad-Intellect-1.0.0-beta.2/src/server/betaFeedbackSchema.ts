import { z } from "zod";
import {
  betaEventsSchema,
  feedbackSchema,
  normalizedScoresSchema,
  profileCodeSchema,
  submissionProofFields,
} from "./submissionSchemas";

const meaningfulFeedbackSchema = feedbackSchema.refine(
  (feedback) =>
    feedback.accuracyRating !== undefined ||
    Boolean(feedback.mostTrue) ||
    Boolean(feedback.mostWrong) ||
    feedback.wouldShare !== undefined ||
    feedback.wouldPayDeeper !== undefined ||
    feedback.pmfResponse !== undefined ||
    Boolean(feedback.idealUser),
  { message: "At least one feedback answer is required." },
);

export const betaFeedbackSubmissionSchema = z
  .object({
    profileCode: profileCodeSchema,
    normalizedScores: normalizedScoresSchema,
    feedback: meaningfulFeedbackSchema,
    betaEvents: betaEventsSchema,
    ...submissionProofFields,
  })
  .strict();

export type BetaFeedbackSubmissionPayload = z.infer<typeof betaFeedbackSubmissionSchema>;

export function validateBetaFeedbackSubmission(
  body: unknown,
):
  | { readonly success: true; readonly data: BetaFeedbackSubmissionPayload }
  | { readonly success: false; readonly error: string } {
  const result = betaFeedbackSubmissionSchema.safeParse(body);
  if (!result.success) {
    return { success: false, error: "Invalid request payload." };
  }
  return { success: true, data: result.data };
}
