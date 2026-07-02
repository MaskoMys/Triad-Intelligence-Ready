import { afterEach, describe, expect, it, vi } from "vitest";
import type { KvNamespace } from "./cloudflare";
import {
  prepareSubmission,
  publicSubmissionError,
  type SubmissionEnv,
  type SubmissionProof,
} from "./submission";

interface FixturePayload extends SubmissionProof {
  readonly value: string;
}

const validPayload: FixturePayload = {
  value: "ok",
  inviteCode: "private-code",
  formStartedAt: Date.now() - 5000,
  website: "",
};

const validate = (body: unknown) => {
  if (!body || typeof body !== "object" || !("value" in body)) {
    return { success: false as const, error: "invalid" };
  }
  return { success: true as const, data: body as FixturePayload };
};

function localEnv(overrides: Partial<SubmissionEnv> = {}): SubmissionEnv {
  return {
    BETA_INVITE_CODE: "private-code",
    EMAIL_DELIVERY_MODE: "console",
    ...overrides,
  };
}

function requestFor(body: unknown, init: RequestInit = {}): Request {
  return new Request("http://localhost:8788/api/test", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:8788",
      ...Object.fromEntries(new Headers(init.headers).entries()),
    },
    body: JSON.stringify(body),
    ...init,
  });
}

async function prepare(request: Request, env: SubmissionEnv = localEnv()) {
  return prepareSubmission({
    request,
    env,
    requestId: "request-1",
    routeKey: "test-route",
    expectedTurnstileAction: "test-route",
    validate,
  });
}

afterEach(() => vi.restoreAllMocks());

describe("submission preparation", () => {
  it("accepts a valid local console-mode submission", async () => {
    const result = await prepare(requestFor(validPayload));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.payload.value).toBe("ok");
  });

  it("rejects cross-origin and non-JSON requests", async () => {
    const crossOrigin = requestFor(validPayload, {
      headers: {
        "Content-Type": "application/json",
        Origin: "https://attacker.example",
      },
    });
    const wrongType = requestFor(validPayload, {
      headers: { "Content-Type": "text/plain" },
    });

    const crossResult = await prepare(crossOrigin);
    const typeResult = await prepare(wrongType);
    expect(crossResult.ok).toBe(false);
    expect(typeResult.ok).toBe(false);
    if (!crossResult.ok) expect(crossResult.response.status).toBe(403);
    if (!typeResult.ok) expect(typeResult.response.status).toBe(415);
  });

  it("fails closed when required configuration is absent", async () => {
    const result = await prepare(requestFor(validPayload), {});
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(503);
  });

  it("rejects malformed JSON and schema failures", async () => {
    const malformed = new Request("http://localhost:8788/api/test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:8788",
      },
      body: "{",
    });
    const invalid = requestFor({ inviteCode: "private-code" });

    const malformedResult = await prepare(malformed);
    const invalidResult = await prepare(invalid);
    expect(malformedResult.ok).toBe(false);
    expect(invalidResult.ok).toBe(false);
    if (!malformedResult.ok) expect(malformedResult.response.status).toBe(400);
    if (!invalidResult.ok) expect(invalidResult.response.status).toBe(400);
  });

  it("rejects oversized, automated, and mistimed requests", async () => {
    const oversized = requestFor(validPayload, {
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:8788",
        "Content-Length": "20000",
      },
    });
    const honeypot = requestFor({ ...validPayload, website: "bot" });
    const tooFast = requestFor({ ...validPayload, formStartedAt: Date.now() });

    for (const request of [oversized, honeypot, tooFast]) {
      const result = await prepare(request);
      expect(result.ok).toBe(false);
      if (!result.ok) expect([400, 413]).toContain(result.response.status);
    }
  });

  it("rejects an incorrect invite code", async () => {
    const result = await prepare(
      requestFor({ ...validPayload, inviteCode: "wrong-code" }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(403);
  });

  it("returns rate-limit headers when the KV counter is exhausted", async () => {
    const namespace: KvNamespace = {
      get: () => Promise.resolve("5"),
      put: () => Promise.resolve(),
    };
    const result = await prepare(
      requestFor(validPayload),
      localEnv({ RATE_LIMIT_KV: namespace, RATE_LIMIT_MAX: "5" }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(429);
      expect(result.response.headers.get("Retry-After")).toBeTruthy();
    }
  });

  it("requires Turnstile configuration for non-local requests", async () => {
    const request = new Request("https://triad.example/api/test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://triad.example",
      },
      body: JSON.stringify(validPayload),
    });
    const result = await prepare(request, {
      BETA_INVITE_CODE: "private-code",
      RESEND_API_KEY: "re_test",
      RECEIVER_EMAIL: "operator@example.com",
      FROM_EMAIL: "Tri-Ad <beta@example.com>",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(503);
  });

  it("builds generic public errors", async () => {
    const response = publicSubmissionError(429, "RATE_LIMITED", "request-2", {
      "Retry-After": "60",
    });
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("60");
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      code: "RATE_LIMITED",
      requestId: "request-2",
    });
  });
});
