export interface KvPutOptions {
  readonly expiration?: number;
  readonly expirationTtl?: number;
  readonly metadata?: unknown;
}

export interface KvNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: KvPutOptions): Promise<void>;
}

export interface PagesContext<Env = Record<string, unknown>> {
  readonly request: Request;
  readonly env: Env;
  readonly params: Record<string, string | readonly string[]>;
  readonly data: Record<string, unknown>;
  readonly waitUntil: (promise: Promise<unknown>) => void;
  readonly next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
}

export type PagesFunction<Env = Record<string, unknown>> = (
  context: PagesContext<Env>,
) => Response | Promise<Response>;
