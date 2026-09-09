import type { ExtensionResult, CheckExtensionsOptions } from "./types";

type RecordType = "NS" | "A";

const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_CONCURRENCY = 30;

interface ProviderConfig {
  endpoint: string;
  headers: Record<string, string>;
}

const PROVIDERS: Record<"cloudflare" | "google", ProviderConfig> = {
  cloudflare: {
    endpoint:
      "https://cloudflare-dns.com/dns-query?name={domain}&type={type}",
    headers: { Accept: "application/dns-json" },
  },
  google: {
    endpoint: "https://dns.google/resolve?name={domain}&type={type}",
    headers: { Accept: "application/dns-json" },
  },
};

interface QueryOutcome {
  ok: boolean;
  rcode: number | null;
  answers: Array<{ type: number }>;
  error?: string;
  timedOut?: boolean;
  aborted?: boolean;
}

function queryProvider(
  domain: string,
  type: RecordType,
  resolver: "cloudflare" | "google",
  signal?: AbortSignal
): Promise<QueryOutcome> {
  const controller = new AbortController();

  const onAbort = () => controller.abort();
  const onTimeout = () => controller.abort();

  controller.signal.addEventListener("abort", () => {
    clearTimeout(timeoutId);
  });

  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  if (signal) {
    if (signal.aborted) {
      return Promise.resolve({ ok: false, rcode: null, answers: [], aborted: true });
    }
    signal.addEventListener("abort", onAbort, { once: true });
  }
  timeoutId = setTimeout(onTimeout, DEFAULT_TIMEOUT_MS);

  const config = PROVIDERS[resolver];
  const url = config.endpoint
    .replace("{domain}", encodeURIComponent(domain))
    .replace("{type}", type);

  const cleanup = () => {
    if (signal) signal.removeEventListener("abort", onAbort);
    clearTimeout(timeoutId);
  };

  return fetch(url, {
    method: "GET",
    headers: config.headers,
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        return {
          ok: false,
          rcode: null,
          answers: [],
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
      const body = (await response.json()) as {
        Status?: number;
        Answer?: Array<{ type: number }>;
      };
      return {
        ok: true,
        rcode: typeof body.Status === "number" ? body.Status : null,
        answers: body.Answer ?? [],
      };
    })
    .catch((err: unknown) => {
      if (err instanceof DOMException && err.name === "AbortError") {
        if (signal?.aborted) {
          return { ok: false, rcode: null, answers: [], aborted: true };
        }
        return {
          ok: false,
          rcode: null,
          answers: [],
          error: `Request timed out after ${DEFAULT_TIMEOUT_MS}ms`,
          timedOut: true,
        };
      }
      return {
        ok: false,
        rcode: null,
        answers: [],
        error: `Network error: ${err instanceof Error ? err.message : String(err)}`,
      };
    })
    .finally(cleanup);
}

/**
 * NS/A lookup with cross-resolver failover: uses the requested provider first
 * and retries the alternate (Cloudflare <-> Google) on transport-level errors
 * (timeout / HTTP / network). A valid NXDOMAIN or empty answer set is a real
 * result, not a failure.
 */
async function resolveDoh(
  domain: string,
  type: RecordType,
  resolver: "cloudflare" | "google",
  signal?: AbortSignal
): Promise<{ hasRecords: boolean; error?: string }> {
  const alternate: "cloudflare" | "google" =
    resolver === "cloudflare" ? "google" : "cloudflare";
  const order = [resolver, alternate];

  let lastError: string | undefined;

  for (const attempt of order) {
    if (signal?.aborted) {
      return { hasRecords: false, error: "Request aborted" };
    }

    const query = await queryProvider(domain, type, attempt, signal);

    if (!query.ok) {
      if (query.aborted) {
        return { hasRecords: false, error: "Request aborted" };
      }
      lastError = query.error ?? "Request failed";
      continue; // fail over to the alternate provider
    }

    if (query.rcode === 3) {
      return { hasRecords: false };
    }
    if (query.rcode !== null && query.rcode !== 0) {
      return {
        hasRecords: false,
        error: `DNS status ${query.rcode}`,
      };
    }

    const recordType = type === "NS" ? 2 : 1;
    return {
      hasRecords: query.answers.some((a) => a.type === recordType),
    };
  }

  return { hasRecords: false, error: lastError ?? "Request failed" };
}

async function runWithConcurrency<T, R>(
  items: T[],
  worker: (item: T, index: number) => Promise<R>,
  concurrency: number,
  signal?: AbortSignal
): Promise<(R | undefined)[]> {
  const results: (R | undefined)[] = new Array(items.length);

  if (items.length === 0) return results;
  if (signal?.aborted) return results;

  let aborted = false;
  let nextIndex = 0;
  let inFlight = 0;

  const onAbort = () => {
    aborted = true;
  };
  signal?.addEventListener("abort", onAbort, { once: true });

  return new Promise((resolve) => {
    function startNext(): void {
      while (nextIndex < items.length && inFlight < concurrency && !aborted) {
        const idx = nextIndex++;
        inFlight++;

        worker(items[idx], idx)
          .then((r) => {
            results[idx] = r;
          })
          .catch(() => {})
          .finally(() => {
            inFlight--;
            if (inFlight === 0 && nextIndex >= items.length) {
              signal?.removeEventListener("abort", onAbort);
              resolve(results);
            } else {
              startNext();
            }
          });
      }

      if (inFlight === 0 && nextIndex >= items.length) {
        signal?.removeEventListener("abort", onAbort);
        resolve(results);
      }
    }

    startNext();
  });
}

/**
 * Checks a root word against a list of TLDs.
 *
 * Optimised for the /domains refresh flow:
 * - NS is checked for every TLD (that is what determines "reserved variants").
 * - The A-record lookup only runs for TLDs that turn out to be reserved — the
 *   only case where the "live" flag is meaningful — halving network traffic.
 * - Higher concurrency + cross-resolver failover cut wall-clock time.
 */
export async function checkAllExtensionsForRoot(
  root: string,
  tlds: string[],
  resolver: string,
  options: CheckExtensionsOptions = {}
): Promise<ExtensionResult[]> {
  const { concurrency = DEFAULT_CONCURRENCY, signal } = options;

  if (tlds.length === 0) return [];
  if (signal?.aborted) return [];

  const provider: "cloudflare" | "google" =
    resolver === "google" ? "google" : "cloudflare";

  const jobs = tlds.map((tld) => ({
    tld,
    fullDomain: `${root}.${tld}`,
  }));

  const results = await runWithConcurrency(
    jobs,
    async (job) => {
      const startedAt = performance.now();

      const ns = await resolveDoh(job.fullDomain, "NS", provider, signal);

      const isReserved = ns.hasRecords && !ns.error;

      let isLive = false;
      let aError: string | undefined;
      if (isReserved) {
        const a = await resolveDoh(job.fullDomain, "A", provider, signal);
        isLive = a.hasRecords && !a.error;
        aError = a.error;
      }

      const tookMs = Math.round(performance.now() - startedAt);

      const result: ExtensionResult = {
        tld: job.tld,
        fullDomain: job.fullDomain,
        isReserved,
        isLive,
        resolver,
        tookMs,
        error: ns.error ?? aError,
      };

      return result;
    },
    concurrency,
    signal
  );

  return results.filter((r): r is ExtensionResult => r !== undefined);
}
