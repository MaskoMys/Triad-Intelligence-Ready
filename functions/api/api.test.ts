import { afterEach, describe, expect, it, vi } from "vitest";
import { questions, scoreAssessment } from "../../src/domain/assessment";
import type { PagesContext } from "../../src/server/cloudflare";
import type { SubmissionEnv } from "../../src/server/submission";
import { onRequestGet as feedbackGet, onRequestPost as feedbackPost } from "./beta-feedback";
import { onRequestGet as healthGet } from "./health";
import { onRequestGet as premiumGet, onRequestPost as premiumPost } from "./premium-order";

function context<Env = SubmissionEnv>(request: Request, env: Env = {} as Env): PagesContext<Env> {
  return {
    request,
    env,
    params: {},
    data: {},
    waitUntil: () => {},
    next: () => Promise.resolve(new Response(null, { status: 404 })),
  };
}

function scoreFixture() {
  const responses = Object.fromEntries(questions.map((question) => [question.id, 0]));
  return scoreAssessment(responses);
}

function requestFor(path: string, payload: Record<string, unknown>): Request {
  return new Request(`http://localhost:8788${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:8788",
    },
    body: JSON.stringify(payload),
  });
}

function localEnv(): SubmissionEnv {
  return {
    BETA_INVITE_CODE: "private-code",
    EMAIL_DELIVERY_MODE: "console",
  };
}

function proof() {
  return {
    inviteCode: "private-code",
    formStartedAt: Date.now() - 5000,
    website: "",
  };
}

afterEach(() => vi.restoreAllMocks());

describe("Cloudflare Pages API handlers", () => {
  it("returns a no-store health response", async () => {
    const response = await healthGet(
      context<Record<string, unknown>>(new Request("https://triad.example/api/health"), {}),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      service: "triad-pages-functions",
    });
  });

  it("returns 405 and an Allow header for submission GET requests", async () => {
    const request = new Request("https://triad.example/api/premium-order");
    const [premium, feedback] = await Promise.all([
      premiumGet(context(request)),
      feedbackGet(context(new Request("https://triad.example/api/beta-feedback"))),
    ]);

    expect(premium.status).toBe(405);
    expect(feedback.status).toBe(405);
    expect(premium.headers.get("Allow")).toBe("POST");
    expect(feedback.headers.get("Allow")).toBe("POST");
  });

  it("accepts a valid local premium request without exposing the email provider", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    const scored = scoreFixture();
    const response = await premiumPost(
      context(
        requestFor("/api/premium-order", {
          name: "Ada Lovelace",
          email: "ada@example.com",
          profileCode: scored.profileCode,
          normalizedScores: scored.normalizedScores,
          betaEvents: { results_viewed: 1 },
          ...proof(),
        }),
        localEnv(),
      ),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
  });

  it("accepts privacy-conscious beta feedback without name or email", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    const scored = scoreFixture();
    const response = await feedbackPost(
      context(
        requestFor("/api/beta-feedback", {
          profileCode: scored.profileCode,
          normalizedScores: scored.normalizedScores,
          feedback: {
            accuracyRating: 4,
            pmfResponse: "very-disappointed",
          },
          betaEvents: { feedback_saved: 1 },
          ...proof(),
        }),
        localEnv(),
      ),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
  });

  it("rejects a profile code that does not match the submitted scores", async () => {
    const scored = scoreFixture();
    const incorrectProfile = scored.profileCode === "CDL" ? "IDE" : "CDL";
    const response = await premiumPost(
      context(
        requestFor("/api/premium-order", {
          name: "Ada Lovelace",
          email: "ada@example.com",
          profileCode: incorrectProfile,
          normalizedScores: scored.normalizedScores,
          ...proof(),
        }),
        localEnv(),
      ),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      code: "INVALID_REQUEST",
    });
  });
});
