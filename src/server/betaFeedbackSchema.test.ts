import { describe, expect, it } from "vitest";
import { validateBetaFeedbackSubmission } from "./betaFeedbackSchema";

const validPayload = {
  profileCode: "CDL",
  normalizedScores: {
    creativity: 80,
    innovation: 60,
    physical: 40,
    metaphysical: 50,
    discernment: 90,
    logical: 85,
    emotional: 55,
    predictive: 70,
  },
  feedback: { accuracyRating: 4, wouldShare: true },
  inviteCode: "private-beta-code",
  formStartedAt: Date.now() - 5000,
  website: "",
};

describe("beta feedback payload", () => {
  it("accepts meaningful feedback", () => {
    expect(validateBetaFeedbackSubmission(validPayload).success).toBe(true);
  });

  it.each([
    ["empty feedback", { ...validPayload, feedback: {} }],
    ["unknown profile", { ...validPayload, profileCode: "XYZ" }],
    [
      "out-of-range score",
      {
        ...validPayload,
        normalizedScores: { ...validPayload.normalizedScores, creativity: -1 },
      },
    ],
    ["oversized text", { ...validPayload, feedback: { mostTrue: "x".repeat(1001) } }],
    ["unexpected field", { ...validPayload, email: "not-requested@example.com" }],
  ])("rejects %s", (_label, payload) => {
    expect(validateBetaFeedbackSubmission(payload).success).toBe(false);
  });
});
