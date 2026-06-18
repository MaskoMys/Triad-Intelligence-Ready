import { describe, expect, it, vi } from "vitest";
import { apiHeaders, getRequestId, jsonResponse } from "./http";

describe("HTTP response helpers", () => {
  it("sets defensive headers and preserves additional headers", async () => {
    const response = jsonResponse({ ok: true }, 201, { "X-Test": "yes" });
    expect(response.status).toBe(201);
    expect(response.headers.get("Content-Type")).toContain("application/json");
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
    expect(response.headers.get("X-Test")).toBe("yes");
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it("returns Cloudflare Ray IDs and falls back to a UUID", () => {
    const withRay = new Request("https://example.com", {
      headers: { "CF-Ray": "ray-123" },
    });
    expect(getRequestId(withRay)).toBe("ray-123");

    const uuidSpy = vi
      .spyOn(crypto, "randomUUID")
      .mockReturnValue("00000000-0000-4000-8000-000000000000");
    expect(getRequestId(new Request("https://example.com"))).toBe(
      "00000000-0000-4000-8000-000000000000",
    );
    uuidSpy.mockRestore();
  });

  it("overrides unsafe caller content types", () => {
    const headers = apiHeaders({ "Content-Type": "text/html" });
    expect(headers.get("Content-Type")).toBe("application/json; charset=utf-8");
  });
});
