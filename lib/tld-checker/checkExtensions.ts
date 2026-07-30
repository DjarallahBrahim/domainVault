import type { ExtensionResult, CheckExtensionsOptions } from "./types";

const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_CONCURRENCY = 15;

interface DoHResponse {
  Status: number;
  Answer?: Array<{ type: number; data: string; TTL: number; name: string }>;
}

function combineSignals(
  signal: AbortSignal | undefined,
  timeoutMs: number
): { controller: AbortController; signal: AbortSignal } {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    if (!controller.signal.aborted) controller.abort();
  }, timeoutMs);

  controller.signal.addEventListener("abort", () => clearTimeout(timeoutId), {
    once: true,
  });

  if (signal) {
    if (signal.aborted) {
      controller.abort();
      return { controller, signal: controller.signal };
    }
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  return { controller, signal: controller.signal };
}

async function resolveDoh(
  domain: string,
  type: "NS" | "A",
  signal?: AbortSignal
): Promise<{ hasRecords: boolean; error?: string }> {
  const endpoint = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${type}`;
  const { signal: combinedSignal } = combineSignals(signal, DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: { Accept: "application/dns-json" },
      signal: combinedSignal,
    });

    if (!response.ok) {
      return { hasRecords: false, error: `HTTP ${response.status}` };
    }

    const body = (await response.json()) as DoHResponse;

    if (body.Status === 3) {
      return { hasRecords: false };
    }

    if (body.Status !== 0) {
      return { hasRecords: false, error: `DNS status ${body.Status}` };
    }

    const recordType = type === "NS" ? 2 : 1;
    const hasRecords =
      body.Answer?.some((a) => a.type === recordType) ?? false;

    return { hasRecords };
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return {
        hasRecords: false,
        error: combinedSignal.aborted ? "Request aborted" : "Request timed out",
      };
    }
    return {
      hasRecords: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

interface TldJob {
  tld: string;
  fullDomain: string;
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

export async function checkAllExtensionsForRoot(
  root: string,
  tlds: string[],
  resolver: string,
  options: CheckExtensionsOptions = {}
): Promise<ExtensionResult[]> {
  const { concurrency = DEFAULT_CONCURRENCY, signal } = options;

  if (tlds.length === 0) return [];
  if (signal?.aborted) return [];

  const jobs: TldJob[] = tlds.map((tld) => ({
    tld,
    fullDomain: `${root}.${tld}`,
  }));

  const results = await runWithConcurrency(
    jobs,
    async (job) => {
      const startedAt = performance.now();

      const [nsResult, aResult] = await Promise.all([
        resolveDoh(job.fullDomain, "NS", signal),
        resolveDoh(job.fullDomain, "A", signal),
      ]);

      const tookMs = Math.round(performance.now() - startedAt);

      const bothFailed = nsResult.error && aResult.error;

      const result: ExtensionResult = {
        tld: job.tld,
        fullDomain: job.fullDomain,
        isReserved: nsResult.hasRecords && !nsResult.error,
        isLive: aResult.hasRecords && !aResult.error,
        resolver,
        tookMs,
        error: bothFailed
          ? `Both queries failed: NS(${nsResult.error}), A(${aResult.error})`
          : undefined,
      };

      return result;
    },
    concurrency,
    signal
  );

  return results.filter((r): r is ExtensionResult => r !== undefined);
}
