import type { KvNamespace } from "./cloudflare";
import { jsonResponse } from "./http";
import { enforceRateLimit } from "./rateLimit";
import {
  constantTimeEqual,
  isLocalRequest,
  isSameOriginRequest,
  verifyTurnstile,
} from "./security";
import { cleanSingleLine } from "@/lib/text";

export interface SubmissionEnv {
  readonly RESEND_API_KEY?: string;
  readonly RECEIVER_EMAIL?: string;
  readonly FROM_EMAIL?: string;
  readonly BETA_INVITE_CODE?: string;
  readonly TURNSTILE_SECRET_KEY?: string;
  readonly TURNSTILE_EXPECTED_HOSTNAME?: string;
  readonly EMAIL_DELIVERY_MODE?: string;
  readonly RATE_LIMIT_MAX?: string;
  readonly RATE_LIMIT_KV?: KvNamespace;
}

export interface SubmissionProof {
  readonly inviteCode: string;
  readonly turnstileToken?: string | undefined;
  readonly formStartedAt: number;
  readonly website?: string | undefined;
}

export type SubmissionErrorCode =
  | "INVALID_REQUEST"
  | "FORBIDDEN"
  | "RATE_LIMITED"
  | "SERVICE_UNAVAILABLE";

interface ValidationSuccess<T extends SubmissionProof> {
  readonly success: true;
  readonly data: T;
}

interface ValidationFailure {
  readonly success: false;
  readonly error: string;
}

export type SubmissionValidator<T extends SubmissionProof> = (
  body: unknown,
) => ValidationSuccess<T> | ValidationFailure;

export interface PreparedSubmission<T extends SubmissionProof> {
  readonly ok: true;
  readonly payload: T;
}

export interface RejectedSubmission {
  readonly ok: false;
  readonly response: Response;
}

const MAX_BODY_BYTES = 16_384;
const DEFAULT_RATE_LIMIT = 5;
const RATE_LIMIT_WINDOW_SECONDS = 3_600;
const MINIMUM_FORM_TIME_MS = 1_500;
const MAXIMUM_FORM_TIME_MS = 7_200_000;

function hasSafeHeaderValue(value: string | undefined): value is string {
  return Boolean(value && value.length <= 320 && cleanSingleLine(value) === value);
}

function parseRateLimit(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 100 ? parsed : DEFAULT_RATE_LIMIT;
}

function requiredConfigurationError(env: SubmissionEnv, request: Request): string | null {
  if (!env.BETA_INVITE_CODE) return "BETA_INVITE_CODE";

  const consoleMode = isConsoleDelivery(env, request);
  if (!consoleMode) {
    if (!env.RESEND_API_KEY) return "RESEND_API_KEY";
    if (!hasSafeHeaderValue(env.RECEIVER_EMAIL)) return "RECEIVER_EMAIL";
    if (!hasSafeHeaderValue(env.FROM_EMAIL)) return "FROM_EMAIL";
  }

  if (!isLocalRequest(request) && !env.TURNSTILE_SECRET_KEY) {
    return "TURNSTILE_SECRET_KEY";
  }
  return null;
}

export function isConsoleDelivery(env: SubmissionEnv, request: Request): boolean {
  return env.EMAIL_DELIVERY_MODE === "console" && isLocalRequest(request);
}

export function publicSubmissionError(
  status: number,
  code: SubmissionErrorCode,
  requestId: string,
  additionalHeaders: HeadersInit = {},
): Response {
  return jsonResponse(
    {
      ok: false,
      code,
      error:
        code === "RATE_LIMITED"
          ? "Too many requests. Please try again later."
          : "Unable to submit this request.",
      requestId,
    },
    status,
    additionalHeaders,
  );
}

function rejection(response: Response): RejectedSubmission {
  return { ok: false, response };
}

export async function prepareSubmission<T extends SubmissionProof>(options: {
  readonly request: Request;
  readonly env: SubmissionEnv;
  readonly requestId: string;
  readonly routeKey: string;
  readonly expectedTurnstileAction: string;
  readonly validate: SubmissionValidator<T>;
}): Promise<PreparedSubmission<T> | RejectedSubmission> {
  const { request, env, requestId, routeKey, expectedTurnstileAction, validate } = options;

  if (!isSameOriginRequest(request)) {
    return rejection(publicSubmissionError(403, "FORBIDDEN", requestId));
  }

  const contentType = request.headers.get("Content-Type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return rejection(publicSubmissionError(415, "INVALID_REQUEST", requestId));
  }

  const contentLength = request.headers.get("Content-Length");
  if (contentLength) {
    const declaredLength = Number.parseInt(contentLength, 10);
    if (!Number.isFinite(declaredLength) || declaredLength < 0) {
      return rejection(publicSubmissionError(400, "INVALID_REQUEST", requestId));
    }
    if (declaredLength > MAX_BODY_BYTES) {
      return rejection(publicSubmissionError(413, "INVALID_REQUEST", requestId));
    }
  }

  const configurationError = requiredConfigurationError(env, request);
  if (configurationError) {
    console.error("submission: missing required configuration", {
      requestId,
      routeKey,
      key: configurationError,
    });
    return rejection(publicSubmissionError(503, "SERVICE_UNAVAILABLE", requestId));
  }

  let rateLimit;
  try {
    rateLimit = await enforceRateLimit({
      namespace: env.RATE_LIMIT_KV,
      request,
      scope: routeKey,
      limit: parseRateLimit(env.RATE_LIMIT_MAX),
      windowSeconds: RATE_LIMIT_WINDOW_SECONDS,
    });
  } catch {
    console.error("submission: rate limiter unavailable", { requestId, routeKey });
    return rejection(publicSubmissionError(503, "SERVICE_UNAVAILABLE", requestId));
  }

  if (!rateLimit.allowed) {
    return rejection(
      publicSubmissionError(429, "RATE_LIMITED", requestId, {
        "Retry-After": String(rateLimit.retryAfterSeconds),
      }),
    );
  }

  const bodyText = await request.text();
  if (!bodyText || new TextEncoder().encode(bodyText).byteLength > MAX_BODY_BYTES) {
    return rejection(publicSubmissionError(413, "INVALID_REQUEST", requestId));
  }

  let unknownBody: unknown;
  try {
    unknownBody = JSON.parse(bodyText) as unknown;
  } catch {
    return rejection(publicSubmissionError(400, "INVALID_REQUEST", requestId));
  }

  const validation = validate(unknownBody);
  if (!validation.success) {
    return rejection(publicSubmissionError(400, "INVALID_REQUEST", requestId));
  }
  const payload = validation.data;

  const elapsed = Date.now() - payload.formStartedAt;
  if (payload.website || elapsed < MINIMUM_FORM_TIME_MS || elapsed > MAXIMUM_FORM_TIME_MS) {
    return rejection(publicSubmissionError(400, "INVALID_REQUEST", requestId));
  }

  if (!(await constantTimeEqual(payload.inviteCode, env.BETA_INVITE_CODE ?? ""))) {
    return rejection(publicSubmissionError(403, "FORBIDDEN", requestId));
  }

  const turnstileVerified = await verifyTurnstile({
    token: payload.turnstileToken,
    secret: env.TURNSTILE_SECRET_KEY,
    request,
    expectedAction: expectedTurnstileAction,
    ...(env.TURNSTILE_EXPECTED_HOSTNAME
      ? { expectedHostname: env.TURNSTILE_EXPECTED_HOSTNAME }
      : {}),
  });
  if (!turnstileVerified) {
    return rejection(publicSubmissionError(403, "FORBIDDEN", requestId));
  }

  return { ok: true, payload };
}
