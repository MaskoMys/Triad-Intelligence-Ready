import { afterEach, describe, expect, it, vi } from "vitest";
import {
  constantTimeEqual,
  isLocalRequest,
  isSameOriginRequest,
  verifyTurnstile,
} from "./security";
import { escapeHtml, sanitizeSubjectPart } from "./safeText";

afterEach(() => vi.unstubAllGlobals());

describe("server security helpers", () => {
  it("compares invite values using fixed-length digests", async () => {
    await expect(constantTimeEqual("same", "same")).resolves.toBe(true);
    await expect(constantTimeEqual("same", "different")).resolves.toBe(false);
  });

  it("identifies local requests", () => {
    expect(isLocalRequest(new Request("http://localhost:8788"))).toBe(true);
    expect(isLocalRequest(new Request("http://127.0.0.1:8788"))).toBe(true);
    expect(isLocalRequest(new Request("https://example.com"))).toBe(false);
  });

  it("requires a matching production origin and allows local tooling", () => {
    expect(
      isSameOriginRequest(new Request("https://triad.pages.dev/api")),
    ).toBe(false);
    expect(isSameOriginRequest(new Request("http://localhost:8788/api"))).toBe(
      true,
    );
    expect(
      isSameOriginRequest(
        new Request("https://triad.pages.dev/api", {
          headers: { Origin: "https://triad.pages.dev" },
        }),
      ),
    ).toBe(true);
    expect(
      isSameOriginRequest(
        new Request("https://triad.pages.dev/api", {
          headers: { Origin: "https://attacker.example" },
        }),
      ),
    ).toBe(false);
    expect(
      isSameOriginRequest(
        new Request("https://triad.pages.dev/api", {
          headers: {
            Origin: "https://triad.pages.dev",
            "Sec-Fetch-Site": "cross-site",
          },
        }),
      ),
    ).toBe(false);
  });

  it("allows secretless Turnstile only on localhost", async () => {
    await expect(
      verifyTurnstile({
        token: undefined,
        secret: undefined,
        request: new Request("http://localhost:8788"),
        expectedAction: "test",
      }),
    ).resolves.toBe(true);
    await expect(
      verifyTurnstile({
        token: undefined,
        secret: undefined,
        request: new Request("https://triad.example"),
        expectedAction: "test",
      }),
    ).resolves.toBe(false);
  });

  it("verifies successful Turnstile responses and checks action and hostname", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          action: "premium-order",
          hostname: "triad.example",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const options = {
      token: "token",
      secret: "secret",
      request: new Request("https://triad.example", {
        headers: { "CF-Connecting-IP": "203.0.113.12" },
      }),
      expectedAction: "premium-order",
      expectedHostname: "triad.example",
    } as const;

    await expect(verifyTurnstile(options)).resolves.toBe(true);
    const form = (fetchMock.mock.calls[0]?.[1] as RequestInit).body as FormData;
    expect(form.get("remoteip")).toBe("203.0.113.12");

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, action: "wrong" }), {
        status: 200,
      }),
    );
    await expect(verifyTurnstile(options)).resolves.toBe(false);
  });

  it("rejects missing tokens, provider failures, and network errors", async () => {
    await expect(
      verifyTurnstile({
        token: undefined,
        secret: "secret",
        request: new Request("https://triad.example"),
        expectedAction: "test",
      }),
    ).resolves.toBe(false);

    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      verifyTurnstile({
        token: "token",
        secret: "secret",
        request: new Request("https://triad.example"),
        expectedAction: "test",
      }),
    ).resolves.toBe(false);

    fetchMock.mockRejectedValueOnce(new Error("offline"));
    await expect(
      verifyTurnstile({
        token: "token",
        secret: "secret",
        request: new Request("https://triad.example"),
        expectedAction: "test",
      }),
    ).resolves.toBe(false);
  });

  it("escapes HTML and strips subject control characters", () => {
    expect(escapeHtml("<script>'x'</script>")).toBe(
      "&lt;script&gt;&#039;x&#039;&lt;/script&gt;",
    );
    expect(escapeHtml({ unsafe: true })).toBe("");
    expect(sanitizeSubjectPart("A\r\nB\tC")).toBe("A B C");
  });
});
