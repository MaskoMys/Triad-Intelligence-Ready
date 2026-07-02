import { describe, expect, it } from "vitest";
import {
  questions,
  scoreAssessment,
  type AssessmentResult,
} from "@/domain/assessment";
import {
  buildFeedbackHtml,
  buildFeedbackPlainText,
  buildFeedbackSubject,
  buildOrderHtml,
  buildOrderPlainText,
  buildOrderSubject,
  type BetaFeedbackEmailData,
  type PremiumOrderEmailData,
} from "./emailTemplate";

function scoredFixture(): AssessmentResult {
  const responses = Object.fromEntries(
    questions.map((question) => [question.id, 0]),
  );
  const scored = scoreAssessment(responses);
  return {
    schemaVersion: 1,
    id: "fixture-result",
    timestamp: "2026-06-18T10:00:00.000Z",
    userName: "Fixture",
    ...scored,
  };
}

function commonFixture() {
  const result = scoredFixture();
  return {
    requestId: "request-123",
    timestamp: "2026-06-18T10:00:00.000Z",
    profileCode: result.profileCode,
    macroScores: result.macroScores,
    archetype: result.archetype,
    feedback: {
      accuracyRating: 4,
      mostTrue: "Accurate <section> & detail",
      mostWrong: 'Needs "more" context',
      wouldShare: true,
      wouldPayDeeper: false,
      pmfResponse: "very-disappointed" as const,
      idealUser: "Reflective explorers",
    },
    betaEvents: { results_viewed: 2, pdf_downloaded: 1 },
  };
}

describe("submission email templates", () => {
  it("sanitizes order subjects and escapes HTML fields", () => {
    const data: PremiumOrderEmailData = {
      ...commonFixture(),
      name: "Ada\r\nBcc: attacker@example.com",
      email: "ada@example.com",
    };

    const subject = buildOrderSubject(data);
    const html = buildOrderHtml(data);
    const text = buildOrderPlainText(data);

    expect(subject).not.toMatch(/[\r\n]/);
    expect(subject).toContain(`[${data.profileCode}]`);
    expect(html).toContain("Ada Bcc: attacker@example.com");
    expect(html).toContain("Accurate &lt;section&gt; &amp; detail");
    expect(html).not.toContain("Accurate <section>");
    expect(text).toContain("Accuracy rating: 4/5");
    expect(text).toContain("results_viewed: 2");
    expect(text).toContain("experimental self-reflection tool");
  });

  it("builds feedback messages without requesting identity fields", () => {
    const data: BetaFeedbackEmailData = commonFixture();
    const subject = buildFeedbackSubject(data);
    const html = buildFeedbackHtml(data);
    const text = buildFeedbackPlainText(data);

    expect(subject).toContain(data.profileCode);
    expect(html).toContain("No participant name or email was requested");
    expect(text).toContain("No participant name or email was requested");
    expect(html).toContain("very-disappointed");
    expect(text).toContain("Would share: Yes");
  });

  it("handles omitted optional feedback and beta events safely", () => {
    const common = commonFixture();
    const data: PremiumOrderEmailData = {
      requestId: common.requestId,
      timestamp: common.timestamp,
      profileCode: common.profileCode,
      macroScores: common.macroScores,
      archetype: common.archetype,
      name: "No Optional Data",
      email: "none@example.com",
    };

    expect(buildOrderPlainText(data)).toContain(
      "No optional beta feedback supplied.",
    );
    expect(buildOrderPlainText(data)).toContain(
      "No local event summary supplied.",
    );
    expect(buildOrderHtml(data)).toContain(
      "No optional beta feedback supplied.",
    );
    expect(buildOrderHtml(data)).toContain("No local event summary supplied.");
  });
});
