import type { AfternicCredentials, AfternicErrorBody } from "@/types/afternic";

const AFTERNIC_BASE = "https://api.afternic.com/v3/aftermarket/customers/my";

export class AfternicError extends Error {
  status: number;
  code?: string;
  details?: string;
  fields?: AfternicErrorBody["fields"];

  constructor(
    message: string,
    options: {
      status?: number;
      code?: string;
      details?: string;
      fields?: AfternicErrorBody["fields"];
    } = {}
  ) {
    super(message);
    this.name = "AfternicError";
    this.status = options.status ?? 0;
    this.code = options.code;
    this.details = options.details;
    this.fields = options.fields;
  }
}

export function isAfternicError(error: unknown): error is AfternicError {
  return error instanceof AfternicError;
}

/* -------------------------------------------------------------------------- */
/* Rate limiting                                                              */
/* -------------------------------------------------------------------------- */

const RATE_LIMIT_PER_MINUTE = 150;
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

/**
 * Token bucket shared by every Afternic route in this server process.
 * Serverless instances do not share memory, so this is best-effort per warm
 * instance; providers still enforce the hard 150 req/min ceiling.
 */
async function acquireToken(bucketKey: string): Promise<void> {
  while (true) {
    const now = Date.now();
    const bucket = buckets.get(bucketKey) ?? {
      tokens: CAPACITY,
      updatedAt: now,
    };

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
      throw new AfternicError("Rate limit exceeded. Try again shortly.", {
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

function parseErrorBody(body: unknown): AfternicErrorBody {
  if (!body || typeof body !== "object") return {};
  return body as AfternicErrorBody;
}

/**
 * Calls the Afternic Portfolio API.
 *
 * - Sends the required `Authorization: sso-key KEY:SECRET` and `User-Agent`.
 * - Handles `204 No Content`.
 * - Retries `429` once honouring `Retry-After`.
 * - Retries `5xx` twice with exponential backoff.
 * - Throws `AfternicError` for any non-2xx response.
 */
export async function callAfternic<T>(
  credentials: AfternicCredentials,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: Record<string, unknown>
): Promise<T> {
  const url = `${AFTERNIC_BASE}${path}`;
  const bucketKey = credentials.apiKey;

  let rateRetries = 0;
  let serverRetries = 0;

  while (true) {
    await acquireToken(bucketKey);

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: {
          Authorization: `sso-key ${credentials.apiKey}:${credentials.apiSecret}`,
          "User-Agent": "DomainVault/1.0",
          "Content-Type": "application/json",
          Accept: "application/json",
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
      throw new AfternicError("Could not reach Afternic. Try again.", {
        status: 0,
      });
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
      const message =
        errorBody.message ??
        errorBody.details ??
        (response.status === 429
          ? "Rate limit exceeded. Try again shortly."
          : `Afternic API error (${response.status})`);

      throw new AfternicError(message, {
        status: response.status,
        code: errorBody.code,
        details: errorBody.details,
        fields: errorBody.fields,
      });
    }

    return (parsed ?? undefined) as T;
  }
}
