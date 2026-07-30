import type { TldCheckResult, DoHNSResponse } from "./types";
import { getProvider } from "./providers";

const DEFAULT_TIMEOUT_MS = 5000;

function combineSignals(
  signal: AbortSignal | undefined,
  timeoutMs: number
): { controller: AbortController; signal: AbortSignal } {
  const controller = new AbortController();

  const abort = () => {
    if (!controller.signal.aborted) {
      controller.abort();
    }
  };

  controller.signal.addEventListener("abort", () => {
    clearTimeout(timeoutId);
  });

  const timeoutId = setTimeout(abort, timeoutMs);

  if (signal) {
    if (signal.aborted) {
      abort();
      return { controller, signal: controller.signal };
    }
    signal.addEventListener("abort", abort, { once: true });
  }

  return { controller, signal: controller.signal };
}

export async function checkAvailability(
  domain: string,
  signal?: AbortSignal
): Promise<TldCheckResult> {
  const provider = getProvider();
  const url = provider.endpoint.replace(
    "{domain}",
    encodeURIComponent(domain)
  );
  const { signal: combinedSignal } = combineSignals(signal, DEFAULT_TIMEOUT_MS);

  const startedAt = performance.now();

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: provider.headers,
      signal: combinedSignal,
    });

    const tookMs = Math.round(performance.now() - startedAt);

    if (!response.ok) {
      const parts = domain.split(".");
      const tld = parts.pop() ?? "";
      const word = parts.join(".");

      return {
        word,
        tld,
        domain,
        status: "error",
        error: `HTTP ${response.status}: ${response.statusText}`,
        tookMs,
      };
    }

    let body: DoHNSResponse;
    try {
      body = (await response.json()) as DoHNSResponse;
    } catch {
      const parts = domain.split(".");
      const tld = parts.pop() ?? "";
      const word = parts.join(".");

      return {
        word,
        tld,
        domain,
        status: "error",
        error: "Failed to parse DNS response",
        tookMs,
      };
    }

    const parts = domain.split(".");
    const tld = parts.pop() ?? "";
    const word = parts.join(".");

    if (body.Status === 3) {
      return {
        word,
        tld,
        domain,
        status: "available",
        tookMs,
      };
    }

    if (body.Status !== 0) {
      return {
        word,
        tld,
        domain,
        status: "error",
        error: `DNS server error: status code ${body.Status}`,
        tookMs,
      };
    }

    const hasNS =
      body.Answer?.some((a) => a.type === 2) ?? false;

    if (hasNS) {
      return {
        word,
        tld,
        domain,
        status: "registered",
        tookMs,
      };
    }

    return {
      word,
      tld,
      domain,
      status: "error",
      error: "No NS records and not NXDOMAIN",
      tookMs,
    };
  } catch (err: unknown) {
    const tookMs = Math.round(performance.now() - startedAt);
    const parts = domain.split(".");
    const tld = parts.pop() ?? "";
    const word = parts.join(".");

    if (err instanceof DOMException && err.name === "AbortError") {
      return {
        word,
        tld,
        domain,
        status: "error",
        error: combinedSignal.aborted && !signal?.aborted
          ? `Request timed out after ${DEFAULT_TIMEOUT_MS}ms`
          : "Request aborted",
        tookMs,
      };
    }

    return {
      word,
      tld,
      domain,
      status: "error",
      error: `Network error: ${err instanceof Error ? err.message : String(err)}`,
      tookMs,
    };
  }
}

export interface CheckBatchOptions {
  concurrency?: number;
  signal?: AbortSignal;
}

async function runWithConcurrency<T>(
  items: T[],
  runner: (item: T, index: number) => Promise<void>,
  concurrency: number,
  signal?: AbortSignal
): Promise<boolean> {
  if (items.length === 0) return true;

  let aborted = false;
  let nextIndex = 0;
  let inFlight = 0;

  const abortHandler = () => {
    aborted = true;
  };

  if (signal) {
    if (signal.aborted) return false;
    signal.addEventListener("abort", abortHandler, { once: true });
  }

  return new Promise<boolean>((resolve) => {
    function startNext(): void {
      while (nextIndex < items.length && inFlight < concurrency && !aborted) {
        const idx = nextIndex++;
        inFlight++;

        runner(items[idx], idx)
          .catch(() => {})
          .finally(() => {
            inFlight--;
            if (inFlight === 0 && nextIndex >= items.length) {
              if (signal) signal.removeEventListener("abort", abortHandler);
              resolve(!aborted);
            } else {
              startNext();
            }
          });
      }
    }

    startNext();

    if (inFlight === 0 && nextIndex >= items.length) {
      if (signal) signal.removeEventListener("abort", abortHandler);
      resolve(!aborted);
    }
  });
}

export async function checkAvailabilityBatch(
  domains: string[],
  options: CheckBatchOptions = {}
): Promise<TldCheckResult[]> {
  const { concurrency = 20, signal } = options;

  if (domains.length === 0) return [];
  if (signal?.aborted) return [];

  const results: TldCheckResult[] = new Array(domains.length);

  const completed = await runWithConcurrency(
    domains,
    async (domain, index) => {
      const result = await checkAvailability(domain, signal);
      results[index] = result;
    },
    concurrency,
    signal
  );

  if (!completed) return [];
  return results.filter((r): r is TldCheckResult => r !== undefined);
}
