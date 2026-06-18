import { describe, expect, it } from "vitest";
import { validatePremiumOrder } from "./premiumOrderSchema";

const validPayload = {
  name: "Beta Explorer",
  email: "explorer@example.com",
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
  inviteCode: "private-beta-code",
  formStartedAt: Date.now() - 5000,
  website: "",
};

describe("premium order payload", () => {
  it("accepts a valid strict payload", () => {
    const result = validatePremiumOrder(validPayload);
    expect(result.success).toBe(true);
  });

  it.each([
    ["invalid email", { ...validPayload, email: "invalid" }],
    ["unknown profile", { ...validPayload, profileCode: "XYZ" }],
    [
      "out of range score",
      {
        ...validPayload,
        normalizedScores: { ...validPayload.normalizedScores, logical: 101 },
      },
    ],
    [
      "non-integer rating",
      {
        ...validPayload,
        feedback: { accuracyRating: 4.5 },
      },
    ],
    ["honeypot value", { ...validPayload, website: "bot.example" }],
    ["unexpected field", { ...validPayload, archetype: { name: "forged" } }],
  ])("rejects %s", (_label, payload) => {
    expect(validatePremiumOrder(payload).success).toBe(false);
  });
});
