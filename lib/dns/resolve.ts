import type { Resolver, DnsResult, DohResponse } from "./types";
import { getProvider } from "./providers";

export type { Resolver, DnsResult, DnsStatus, DohResponse } from "./types";

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

export async function resolveDomain(
  domain: string,
  resolver: Resolver,
  signal?: AbortSignal
): Promise<DnsResult> {
  const provider = getProvider(resolver);
  const url = provider.endpoint.replace("{domain}", encodeURIComponent(domain));
  const { signal: combinedSignal } = combineSignals(
    signal,
    DEFAULT_TIMEOUT_MS
  );

  const startedAt = performance.now();

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: provider.headers,
      signal: combinedSignal,
    });

    const tookMs = Math.round(performance.now() - startedAt);

    if (!response.ok) {
      return {
        domain,
        resolver,
        status: "no_dns",
        ips: [],
        error: `HTTP ${response.status}: ${response.statusText}`,
        tookMs,
      };
    }

    let body: DohResponse;
    try {
      body = (await response.json()) as DohResponse;
    } catch {
      return {
        domain,
        resolver,
        status: "no_dns",
        ips: [],
        error: "Failed to parse DNS response",
        tookMs,
      };
    }

    if (body.Status !== 0) {
      return {
        domain,
        resolver,
        status: "no_dns",
        ips: [],
        error: `DNS server error: status code ${body.Status}`,
        tookMs,
      };
    }

    const ips =
      body.Answer?.filter((a) => a.type === 1).map((a) => a.data) ?? [];

    if (ips.length === 0) {
      return {
        domain,
        resolver,
        status: "no_dns",
        ips: [],
        tookMs,
      };
    }

    return {
      domain,
      resolver,
      status: "ok",
      ips,
      tookMs,
    };
  } catch (err: unknown) {
    const tookMs = Math.round(performance.now() - startedAt);

    if (err instanceof DOMException && err.name === "AbortError") {
      return {
        domain,
        resolver,
        status: "no_dns",
        ips: [],
        error: combinedSignal.aborted && !signal?.aborted
          ? `Request timed out after ${DEFAULT_TIMEOUT_MS}ms`
          : "Request aborted",
        tookMs,
      };
    }

    return {
      domain,
      resolver,
      status: "no_dns",
      ips: [],
      error: `Network error: ${err instanceof Error ? err.message : String(err)}`,
      tookMs,
    };
  }
}

export interface ResolveBatchOptions {
  concurrency?: number;
  signal?: AbortSignal;
}

async function runWithConcurrency<T>(
  items: T[],
  runner: (item: T, index: number) => Promise<void>,
  concurrency: number,
  signal?: AbortSignal
): Promise<boolean> {
  if (items.length === 0) {
    return true;
  }

  let aborted = false;
  let nextIndex = 0;
  let inFlight = 0;

  const abortHandler = () => {
    aborted = true;
  };

  if (signal) {
    if (signal.aborted) {
      return false;
    }
    signal.addEventListener("abort", abortHandler, { once: true });
  }

  return new Promise<boolean>((resolve) => {
    function startNext(): void {
      while (nextIndex < items.length && inFlight < concurrency && !aborted) {
        const idx = nextIndex++;
        inFlight++;

        runner(items[idx], idx)
          .catch(() => {
            // failures are handled by the runner; suppress unhandled rejections
          })
          .finally(() => {
            inFlight--;

            if (inFlight === 0 && nextIndex >= items.length) {
              if (signal) {
                signal.removeEventListener("abort", abortHandler);
              }
              resolve(!aborted);
            } else {
              startNext();
            }
          });
      }
    }

    startNext();

    if (inFlight === 0 && nextIndex >= items.length) {
      if (signal) {
        signal.removeEventListener("abort", abortHandler);
      }
      resolve(!aborted);
    }
  });
}

export async function resolveBatch(
  domains: string[],
  resolver: Resolver,
  options: ResolveBatchOptions = {}
): Promise<DnsResult[]> {
  const { concurrency = 20, signal } = options;

  if (domains.length === 0) {
    return [];
  }

  if (signal?.aborted) {
    return [];
  }

  const results: DnsResult[] = new Array(domains.length);

  const completed = await runWithConcurrency(
    domains,
    async (domain, index) => {
      const result = await resolveDomain(domain, resolver, signal);
      results[index] = result;
    },
    concurrency,
    signal
  );

  if (!completed) {
    return [];
  }

  return results.filter((r): r is DnsResult => r !== undefined);
}
