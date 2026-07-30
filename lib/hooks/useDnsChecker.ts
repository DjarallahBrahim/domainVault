"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { Resolver, DnsResult } from "@/lib/dns/resolve";
import { resolveDomain } from "@/lib/dns/resolve";
import { parseDomainList } from "@/lib/dns/parseInput";

type FilterValue = "all" | "dns_ok" | "no_dns";

interface ComparisonResult {
  domain: string;
  cloudflare: DnsResult;
  google: DnsResult;
  mismatch: boolean;
}

function ipArraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((ip, i) => ip === sortedB[i]);
}

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
  compareMode: boolean;
  setCompareMode: (v: boolean) => void;
  compareResults: (ComparisonResult | null)[];
  buildCsv: () => string;
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

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
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
  const [compareMode, setCompareMode] = useState(false);
  const [compareResults, setCompareResults] = useState<
    (ComparisonResult | null)[]
  >([]);

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

    const totalDomains = parsedDomains.length;
    const isCompare = compareMode;

    setIsLoading(true);

    if (isCompare) {
      setCompareResults(new Array(totalDomains).fill(null));
      setResults([]);
      setProgress({ done: 0, total: totalDomains * 2 });
    } else {
      setResults(new Array(totalDomains).fill(null));
      setCompareResults([]);
      setProgress({ done: 0, total: totalDomains });
    }

    // Analytics event (aggregate only — no domains or IPs)
    try {
      window.dispatchEvent(
        new CustomEvent("dns_lookup_run", {
          detail: {
            resolver: isCompare ? "compare" : resolver,
            domainCount: totalDomains,
            timestamp: Date.now(),
          },
        })
      );
    } catch {
      // Analytics service unavailable — ignore
    }

    const controller = new AbortController();
    abortRef.current = controller;

    const signal = controller.signal;

    if (isCompare) {
      const cfResults: (DnsResult | null)[] = new Array(totalDomains).fill(
        null
      );
      const ggResults: (DnsResult | null)[] = new Array(totalDomains).fill(
        null
      );

      let cfDone = false;
      let ggDone = false;

      function tryFinish() {
        if (!cfDone || !ggDone) return;
        const merged: (ComparisonResult | null)[] = [];
        for (let i = 0; i < totalDomains; i++) {
          const cf = cfResults[i];
          const gg = ggResults[i];
          if (cf && gg) {
            merged.push({
              domain: parsedDomains[i],
              cloudflare: cf,
              google: gg,
              mismatch: !ipArraysEqual(cf.ips, gg.ips),
            });
          } else {
            merged.push(null);
          }
        }
        setCompareResults(merged);
        setIsLoading(false);
        abortRef.current = null;
      }

      runConcurrencyPool(
        parsedDomains,
        "cloudflare",
        20,
        signal,
        (index, result) => {
          cfResults[index] = result;
          if (!signal.aborted) {
            setProgress((prev) => ({ ...prev, done: prev.done + 1 }));
          }
        }
      ).finally(() => {
        cfDone = true;
        tryFinish();
      });

      runConcurrencyPool(
        parsedDomains,
        "google",
        20,
        signal,
        (index, result) => {
          ggResults[index] = result;
          if (!signal.aborted) {
            setProgress((prev) => ({ ...prev, done: prev.done + 1 }));
          }
        }
      ).finally(() => {
        ggDone = true;
        tryFinish();
      });
    } else {
      runConcurrencyPool(
        parsedDomains,
        resolver,
        20,
        signal,
        (index, result) => {
          setResults((prev) => {
            const next = [...prev];
            next[index] = result;
            return next;
          });
          if (!signal.aborted) {
            setProgress((prev) => ({ ...prev, done: prev.done + 1 }));
          }
        }
      ).finally(() => {
        setIsLoading(false);
        abortRef.current = null;
      });
    }
  }, [isLoading, parsedDomains, resolver, parseError, compareMode]);

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
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

  const isCompareActive = compareMode && compareResults.length > 0;

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

  const buildCsv = useCallback((): string => {
    if (isCompareActive) {
      const rows = compareResults.filter(
        (r): r is ComparisonResult => r !== null
      );
      const header = "domain,cloudflare_status,cloudflare_ips,google_status,google_ips";
      const lines = rows.map((r) =>
        [
          escapeCsvField(r.domain),
          r.cloudflare.status,
          escapeCsvField(r.cloudflare.ips.join(", ")),
          r.google.status,
          escapeCsvField(r.google.ips.join(", ")),
        ].join(",")
      );
      return [header, ...lines].join("\n");
    }

    const rows = results.filter((r): r is DnsResult => r !== null);
    const header = "domain,status,ip";
    const lines = rows.map((r) =>
      [
        escapeCsvField(r.domain),
        r.status,
        escapeCsvField(r.ips.join(", ")),
      ].join(",")
    );
    return [header, ...lines].join("\n");
  }, [isCompareActive, compareResults, results]);

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
    compareMode,
    setCompareMode,
    compareResults,
    buildCsv,
  };
}
