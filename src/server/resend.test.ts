import { afterEach, describe, expect, it, vi } from "vitest";
import { sendResendEmail } from "./resend";

const env = {
  RESEND_API_KEY: "re_test",
  RECEIVER_EMAIL: "operator@example.com",
  FROM_EMAIL: "Tri-Ad <beta@example.com>",
};

afterEach(() => vi.unstubAllGlobals());

describe("Resend transport", () => {
  it("sends a safe HTTP request with idempotency and reply-to", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      sendResendEmail(
        env,
        {
          subject: "subject",
          text: "text",
          html: "<p>text</p>",
          replyTo: "tester@example.com",
        },
        "request-123",
      ),
    ).resolves.toEqual({ delivered: true, status: 202 });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer re_test");
    expect(new Headers(init.headers).get("Idempotency-Key")).toBe("request-123");
    expect(typeof init.body).toBe("string");
    const parsedBody: unknown = JSON.parse(typeof init.body === "string" ? init.body : "{}");
    expect(parsedBody).toMatchObject({
      from: env.FROM_EMAIL,
      to: [env.RECEIVER_EMAIL],
      reply_to: "tester@example.com",
    });
  });

  it("reports provider failures without throwing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 500 })));
    await expect(
      sendResendEmail(env, { subject: "s", text: "t", html: "h" }, "request-2"),
    ).resolves.toEqual({ delivered: false, status: 500 });
  });
});
