export type ApiErrorCode =
  | "INVALID_REQUEST"
  | "FORBIDDEN"
  | "RATE_LIMITED"
  | "METHOD_NOT_ALLOWED"
  | "SERVICE_UNAVAILABLE";

export interface ApiResponseBody {
  readonly ok: boolean;
  readonly error?: string;
  readonly code?: ApiErrorCode;
  readonly requestId?: string;
}

export function apiHeaders(additional: HeadersInit = {}): Headers {
  const headers = new Headers(additional);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store, max-age=0");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  return headers;
}

export function jsonResponse(
  body: ApiResponseBody | Record<string, unknown>,
  status = 200,
  additionalHeaders: HeadersInit = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: apiHeaders(additionalHeaders),
  });
}

export function getRequestId(request: Request): string {
  return request.headers.get("CF-Ray") ?? crypto.randomUUID();
}
