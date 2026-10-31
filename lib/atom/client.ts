import type { AtomCredentials, AtomErrorBody } from "@/types/atom";

const ATOM_BASE = "https://www.atom.com/api/marketplace";

export class AtomError extends Error {
  status: number;
  code?: string;
  details?: string;

  constructor(message: string, options: { status?: number; code?: string; details?: string } = {}) {
    super(message);
    this.name = "AtomError";
    this.status = options.status ?? 0;
    this.code = options.code;
    this.details = options.details;
  }
}

export function isAtomError(error: unknown): error is AtomError {
  return error instanceof AtomError;
}

const FAILURE_MESSAGE =
  /\b(error|failed|failure|invalid|not\s+found|unable|cannot|denied|not\s+allowed|limit\s+reached)\b/i;

/**
 * Atom's message endpoints can return HTTP 200 with a failure message
 * (for example "Domain not found"). Treat those as errors so a failed
 * remove/update never clears the local cache.
 */
export function assertAtomSuccess(result: { message?: string } | null | undefined): void {
  const message = String(result?.message ?? "").trim();
  if (message && FAILURE_MESSAGE.test(message)) {
    throw new AtomError(message, { status: 400 });
  }
}

/* -------------------------------------------------------------------------- */
/* Rate limiting                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Atom publishes no rate limit. We keep a conservative per-token bucket so a
 * bulk operation never hammers the provider. Serverless instances do not share
 * memory, so this is best-effort per warm instance.
 */
const RATE_LIMIT_PER_MINUTE = 120;
const CAPACITY = RATE_LIMIT_PER_MINUTE;
const REFILL_PER_MS = RATE_LIMIT_PER_MINUTE / 60_000;
const MAX_WAIT_MS = 5_000;

interface Bucket {
  tokens: number;
  updatedAt: number;
}

const buckets = new Map<string, Bucket>();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function acquireToken(bucketKey: string): Promise<void> {
  while (true) {
    const now = Date.now();
    const bucket = buckets.get(bucketKey) ?? { tokens: CAPACITY, updatedAt: now };

    const elapsed = now - bucket.updatedAt;
    bucket.tokens = Math.min(CAPACITY, bucket.tokens + elapsed * REFILL_PER_MS);
    bucket.updatedAt = now;

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      buckets.set(bucketKey, bucket);
      return;
    }

    buckets.set(bucketKey, bucket);
    const waitMs = Math.ceil((1 - bucket.tokens) / REFILL_PER_MS);
    if (waitMs > MAX_WAIT_MS) {
      throw new AtomError("Atom rate limit reached. Try again shortly.", {
        status: 429,
        code: "RATE_LIMIT_EXCEEDED",
      });
    }
    await sleep(waitMs);
  }
}

/* -------------------------------------------------------------------------- */
/* Request                                                                    */
/* -------------------------------------------------------------------------- */

function requestId(): string {
  try {
    return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  } catch {
    return `${Date.now()}-${Math.random()}`;
  }
}

function retryAfterMs(response: Response): number {
  const header = response.headers.get("retry-after");
  if (!header) return 1_000;
  const seconds = Number(header);
  if (!Number.isNaN(seconds) && seconds > 0) return Math.min(seconds * 1000, 10_000);
  const date = Date.parse(header);
  if (!Number.isNaN(date)) return Math.min(Math.max(date - Date.now(), 0), 10_000);
  return 1_000;
}

function parseErrorBody(body: unknown): AtomErrorBody {
  if (!body || typeof body !== "object") return {};
  return body as AtomErrorBody;
}

function errorMessage(body: AtomErrorBody, status: number): string {
  return (
    body.message ??
    body.error ??
    body.details ??
    body.errors?.find((item) => item?.message)?.message ??
    (status === 429 ? "Atom rate limit reached. Try again shortly." : `Atom API error (${status})`)
  );
}

function buildUrl(
  path: string,
  credentials: AtomCredentials,
  params?: Record<string, string | number | boolean | null | undefined>
): string {
  const url = new URL(`${ATOM_BASE}${path}`);
  url.searchParams.set("api_token", credentials.apiToken);
  url.searchParams.set("user_id", String(credentials.userId));

  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, String(value));
  }

  return url.toString();
}

/**
 * Calls the Atom Seller API.
 *
 * - Authenticates with `api_token` + `user_id` query parameters.
 * - Always sends `cache: "no-store"`; several Atom write endpoints are GETs.
 * - Retries `429` once honouring `Retry-After`.
 * - Retries `5xx` twice with exponential backoff.
 * - Throws `AtomError` for any non-2xx response.
 *
 * The token lives in the URL, so never include the URL in an error message.
 */
export async function callAtom<T>(
  credentials: AtomCredentials,
  method: "GET" | "POST",
  path: string,
  params?: Record<string, string | number | boolean | null | undefined>,
  body?: Record<string, unknown>
): Promise<T> {
  const url = buildUrl(path, credentials, params);
  const bucketKey = credentials.apiToken;

  let rateRetries = 0;
  let serverRetries = 0;

  while (true) {
    await acquireToken(bucketKey);

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: {
          "User-Agent": "DomainVault/1.0",
          Accept: "application/json",
          ...(body ? { "Content-Type": "application/json" } : {}),
          "X-Request-Id": requestId(),
        },
        body: body ? JSON.stringify(body) : undefined,
        cache: "no-store",
        signal:
          typeof AbortSignal !== "undefined" && "timeout" in AbortSignal
            ? AbortSignal.timeout(20_000)
            : undefined,
      });
    } catch {
      throw new AtomError("Could not reach Atom. Try again.", { status: 0 });
    }

    if (response.status === 429 && rateRetries < 1) {
      rateRetries += 1;
      await sleep(retryAfterMs(response));
      continue;
    }

    if (response.status >= 500 && serverRetries < 2) {
      serverRetries += 1;
      await sleep(500 * 2 ** (serverRetries - 1));
      continue;
    }

    if (response.status === 204) {
      return undefined as unknown as T;
    }

    const text = await response.text();
    let parsed: unknown = undefined;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = undefined;
      }
    }

    if (!response.ok) {
      const errorBody = parseErrorBody(parsed);
      throw new AtomError(errorMessage(errorBody, response.status), {
        status: response.status,
        code: errorBody.code,
        details: errorBody.details,
      });
    }

    return parsed as T;
  }
}
