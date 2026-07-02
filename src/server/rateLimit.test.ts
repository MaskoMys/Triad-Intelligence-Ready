import { describe, expect, it, vi } from "vitest";
import type { KvNamespace } from "./cloudflare";
import { enforceRateLimit } from "./rateLimit";

function createKv(): KvNamespace & { readonly values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    values,
    get: (key) => Promise.resolve(values.get(key) ?? null),
    put: (key, value) => {
      values.set(key, value);
      return Promise.resolve();
    },
  };
}

describe("rate limiting", () => {
  it("allows requests when no KV binding exists", async () => {
    await expect(
      enforceRateLimit({
        namespace: undefined,
        request: new Request("https://example.com"),
        scope: "feedback",
        limit: 5,
        windowSeconds: 60,
      }),
    ).resolves.toEqual({ allowed: true, remaining: 5, retryAfterSeconds: 0 });
  });

  it("counts hashed client identifiers and eventually rejects", async () => {
    const kv = createKv();
    const now = vi.spyOn(Date, "now").mockReturnValue(120_000);
    const request = new Request("https://example.com", {
      headers: { "CF-Connecting-IP": "203.0.113.10" },
    });

    const first = await enforceRateLimit({
      namespace: kv,
      request,
      scope: "feedback",
      limit: 1,
      windowSeconds: 60,
    });
    const second = await enforceRateLimit({
      namespace: kv,
      request,
      scope: "feedback",
      limit: 1,
      windowSeconds: 60,
    });

    expect(first).toEqual({
      allowed: true,
      remaining: 0,
      retryAfterSeconds: 0,
    });
    expect(second.allowed).toBe(false);
    expect(second.retryAfterSeconds).toBeGreaterThan(0);
    expect([...kv.values.keys()][0]).toMatch(/^feedback:[a-f0-9]{64}:2$/);
    now.mockRestore();
  });

  it("falls back to user agent and tolerates corrupt counters", async () => {
    const kv = createKv();
    kv.get = () => Promise.resolve("not-a-number");
    const result = await enforceRateLimit({
      namespace: kv,
      request: new Request("https://example.com", {
        headers: { "User-Agent": "test-agent" },
      }),
      scope: "premium-order",
      limit: 2,
      windowSeconds: 60,
    });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });
});
