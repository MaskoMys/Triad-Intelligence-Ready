import type { PagesFunction } from "../../src/server/cloudflare";
import {
  consolidateMacroScores,
  generateProfileCode,
  getArchetype,
  type TraitScores,
} from "../../src/domain/assessment";
import { normalizeBetaEvents } from "../../src/server/betaEvents";
import { validateBetaFeedbackSubmission } from "../../src/server/betaFeedbackSchema";
import {
  buildFeedbackHtml,
  buildFeedbackPlainText,
  buildFeedbackSubject,
  type BetaFeedbackEmailData,
} from "../../src/server/emailTemplate";
import { getRequestId, jsonResponse } from "../../src/server/http";
import { sendResendEmail } from "../../src/server/resend";
import {
  isConsoleDelivery,
  prepareSubmission,
  publicSubmissionError,
  type SubmissionEnv,
} from "../../src/server/submission";

export const onRequestGet: PagesFunction<SubmissionEnv> = () =>
  jsonResponse(
    { ok: false, code: "METHOD_NOT_ALLOWED", error: "Method not allowed." },
    405,
    {
      Allow: "POST",
    },
  );

export const onRequestPost: PagesFunction<SubmissionEnv> = async ({
  request,
  env,
}) => {
  const requestId = getRequestId(request);
  const prepared = await prepareSubmission({
    request,
    env,
    requestId,
    routeKey: "beta-feedback",
    expectedTurnstileAction: "beta-feedback",
    validate: validateBetaFeedbackSubmission,
  });
  if (!prepared.ok) return prepared.response;

  const payload = prepared.payload;
  const normalizedScores: TraitScores = payload.normalizedScores;
  const computedProfileCode = generateProfileCode(normalizedScores);
  if (computedProfileCode !== payload.profileCode) {
    return publicSubmissionError(400, "INVALID_REQUEST", requestId);
  }

  const betaEvents = normalizeBetaEvents(payload.betaEvents);
  const emailData: BetaFeedbackEmailData = {
    requestId,
    timestamp: new Date().toISOString(),
    profileCode: computedProfileCode,
    macroScores: consolidateMacroScores(normalizedScores),
    archetype: getArchetype(computedProfileCode, normalizedScores),
    feedback: payload.feedback,
    ...(betaEvents ? { betaEvents } : {}),
  };

  if (isConsoleDelivery(env, request)) {
    console.info("beta-feedback: local delivery simulation", {
      requestId,
      profileCode: computedProfileCode,
    });
    return jsonResponse({ ok: true, requestId });
  }

  try {
    const delivery = await sendResendEmail(
      env,
      {
        subject: buildFeedbackSubject(emailData),
        text: buildFeedbackPlainText(emailData),
        html: buildFeedbackHtml(emailData),
      },
      requestId,
    );

    if (!delivery.delivered) {
      console.error("beta-feedback: resend rejected request", {
        requestId,
        status: delivery.status,
        profileCode: computedProfileCode,
      });
      return publicSubmissionError(502, "SERVICE_UNAVAILABLE", requestId);
    }
  } catch (error: unknown) {
    console.error("beta-feedback: email provider unavailable", {
      requestId,
      message: error instanceof Error ? error.message : "unknown error",
    });
    return publicSubmissionError(502, "SERVICE_UNAVAILABLE", requestId);
  }

  return jsonResponse({ ok: true, requestId });
};
