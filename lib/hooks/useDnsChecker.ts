"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { Resolver, DnsResult } from "@/lib/dns/resolve";
import { resolveDomain } from "@/lib/dns/resolve";
import { parseDomainList } from "@/lib/dns/parseInput";

type FilterValue = "all" | "dns_ok" | "no_dns";

interface DnsCheckerState {
  rawInput: string;
  setRawInput: (value: string) => void;
  parsedDomains: string[];
  parseError: string | null;
  resolver: Resolver;
  setResolver: (r: Resolver) => void;
  results: (DnsResult | null)[];
  isLoading: boolean;
  filter: FilterValue;
  setFilter: (f: FilterValue) => void;
  filteredResults: (DnsResult | null)[];
  counts: { all: number; dns_ok: number; no_dns: number };
  progress: { done: number; total: number };
  canResolve: boolean;
  resolveAll: () => void;
}

function matchesFilter(
  result: DnsResult | null,
  filter: FilterValue
): boolean {
  if (!result) return false;
  if (filter === "all") return true;
  if (filter === "dns_ok") return result.status === "ok";
  if (filter === "no_dns") return result.status === "no_dns";
  return true;
}

async function runConcurrencyPool(
  domains: string[],
  resolver: Resolver,
  concurrency: number,
  signal: AbortSignal,
  onResult: (index: number, result: DnsResult) => void
): Promise<void> {
  let nextIndex = 0;
  let inFlight = 0;

  return new Promise<void>((resolve) => {
    function startNext(): void {
      while (
        nextIndex < domains.length &&
        inFlight < concurrency &&
        !signal.aborted
      ) {
        const idx = nextIndex++;
        inFlight++;

        resolveDomain(domains[idx], resolver, signal)
          .then((result) => {
            if (!signal.aborted) {
              onResult(idx, result);
            }
          })
          .catch(() => {
            // Individual failures are handled by resolveDomain (never throws)
          })
          .finally(() => {
            inFlight--;
            if (inFlight === 0 && nextIndex >= domains.length) {
              resolve();
            } else {
              startNext();
            }
          });
      }
    }

    startNext();

    if (inFlight === 0 && nextIndex >= domains.length) {
      resolve();
    }

    if (signal.aborted) {
      resolve();
    }
  });
}

export function useDnsChecker(): DnsCheckerState {
  const [rawInput, setRawInput] = useState("");
  const [parsedDomains, setParsedDomains] = useState<string[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [resolver, setResolver] = useState<Resolver>("cloudflare");
  const [results, setResults] = useState<(DnsResult | null)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<FilterValue>("all");
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedParse = useCallback((text: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      const parsed = parseDomainList(text);

      if ("error" in parsed) {
        setParseError(parsed.error);
        setParsedDomains([]);
      } else {
        setParseError(null);
        setParsedDomains(parsed.domains);
      }
    }, 300);
  }, []);

  useEffect(() => {
    debouncedParse(rawInput);
  }, [rawInput, debouncedParse]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const resolveAll = useCallback(() => {
    if (isLoading || parsedDomains.length === 0 || parseError) {
      return;
    }

    setIsLoading(true);
    setResults(new Array(parsedDomains.length).fill(null));
    setProgress({ done: 0, total: parsedDomains.length });

    const controller = new AbortController();
    abortRef.current = controller;

    runConcurrencyPool(
      parsedDomains,
      resolver,
      20,
      controller.signal,
      (index, result) => {
        setResults((prev) => {
          const next = [...prev];
          next[index] = result;
          return next;
        });
        setProgress((prev) => ({ ...prev, done: prev.done + 1 }));
      }
    ).finally(() => {
      setIsLoading(false);
      abortRef.current = null;
    });
  }, [isLoading, parsedDomains, resolver, parseError]);

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key === "Enter" &&
        !isLoading &&
        parsedDomains.length > 0 &&
        !parseError
      ) {
        e.preventDefault();
        resolveAll();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isLoading, parsedDomains, parseError, resolveAll]);

  const filteredResults = useMemo(
    () => results.filter((r) => matchesFilter(r, filter)),
    [results, filter]
  );

  const counts = useMemo(() => {
    const resolved = results.filter((r) => r !== null) as DnsResult[];
    return {
      all: resolved.length,
      dns_ok: resolved.filter((r) => r.status === "ok").length,
      no_dns: resolved.filter((r) => r.status === "no_dns").length,
    };
  }, [results]);

  const canResolve =
    parsedDomains.length > 0 && !isLoading && !parseError;

  return {
    rawInput,
    setRawInput,
    parsedDomains,
    parseError,
    resolver,
    setResolver,
    results,
    isLoading,
    filter,
    setFilter,
    filteredResults,
    counts,
    progress,
    canResolve,
    resolveAll,
  };
}
