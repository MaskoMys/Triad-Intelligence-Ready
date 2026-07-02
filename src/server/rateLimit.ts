import type { KvNamespace } from "./cloudflare";

export interface RateLimitOptions {
  readonly namespace: KvNamespace | undefined;
  readonly request: Request;
  readonly scope: string;
  readonly limit: number;
  readonly windowSeconds: number;
}

export interface RateLimitResult {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly retryAfterSeconds: number;
}

async function hashIdentifier(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function enforceRateLimit(
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const { namespace, request, scope, limit, windowSeconds } = options;
  if (!namespace) {
    return { allowed: true, remaining: limit, retryAfterSeconds: 0 };
  }

  const clientIdentifier =
    request.headers.get("CF-Connecting-IP") ??
    request.headers.get("User-Agent") ??
    "unknown";
  const identifierHash = await hashIdentifier(clientIdentifier);
  const currentWindow = Math.floor(Date.now() / (windowSeconds * 1000));
  const key = `${scope}:${identifierHash}:${currentWindow}`;
  const existing = Number.parseInt((await namespace.get(key)) ?? "0", 10);
  const count = Number.isFinite(existing) ? existing : 0;

  if (count >= limit) {
    const elapsedSeconds = Math.floor(Date.now() / 1000) % windowSeconds;
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, windowSeconds - elapsedSeconds),
    };
  }

  await namespace.put(key, String(count + 1), {
    expirationTtl: windowSeconds + 60,
  });
  return {
    allowed: true,
    remaining: Math.max(0, limit - count - 1),
    retryAfterSeconds: 0,
  };
}
