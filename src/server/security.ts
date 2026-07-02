export interface TurnstileVerificationResult {
  readonly success: boolean;
  readonly hostname?: string;
  readonly action?: string;
  readonly "error-codes"?: readonly string[];
}

export async function constantTimeEqual(
  left: string,
  right: string,
): Promise<boolean> {
  const encoder = new TextEncoder();
  const [leftDigest, rightDigest] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(left)),
    crypto.subtle.digest("SHA-256", encoder.encode(right)),
  ]);

  const leftBytes = new Uint8Array(leftDigest);
  const rightBytes = new Uint8Array(rightDigest);
  let difference = 0;
  for (let index = 0; index < leftBytes.length; index += 1) {
    difference |= leftBytes[index]! ^ rightBytes[index]!;
  }
  return difference === 0;
}

export function isLocalRequest(request: Request): boolean {
  const hostname = new URL(request.url).hostname;
  return (
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
  );
}

export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("Origin");
  if (!origin) return isLocalRequest(request);
  if (origin !== new URL(request.url).origin) return false;

  const fetchSite = request.headers.get("Sec-Fetch-Site");
  return !fetchSite || fetchSite === "same-origin" || fetchSite === "none";
}

export async function verifyTurnstile(options: {
  readonly token: string | undefined;
  readonly secret: string | undefined;
  readonly request: Request;
  readonly expectedHostname?: string;
  readonly expectedAction: string;
}): Promise<boolean> {
  const { token, secret, request, expectedHostname, expectedAction } = options;
  if (!secret) return isLocalRequest(request);
  if (!token) return false;

  const payload = new FormData();
  payload.append("secret", secret);
  payload.append("response", token);
  payload.append("idempotency_key", crypto.randomUUID());

  const remoteIp = request.headers.get("CF-Connecting-IP");
  if (remoteIp) payload.append("remoteip", remoteIp);

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: payload,
        signal: AbortSignal.timeout(8_000),
      },
    );
    if (!response.ok) return false;

    const result = (await response.json()) as TurnstileVerificationResult;
    if (!result.success || result.action !== expectedAction) return false;
    if (expectedHostname && result.hostname !== expectedHostname) return false;
    return true;
  } catch {
    return false;
  }
}
