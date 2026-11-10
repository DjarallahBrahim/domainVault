"use client";

import { useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { extractRootWord } from "@/lib/tld-checker/rootExtractor";
import { checkAllExtensionsForRoot } from "@/lib/tld-checker/checkExtensions";
import { persistResults } from "@/lib/tld-checker/persistResults";
import { fetchExtensionChecks } from "@/lib/supabase/queries/extension-checks";
import { buildReportText, saveReportToCache } from "@/lib/tld-checker/report";
import type { TldReport, TldReportEntry } from "@/lib/tld-checker/report";

interface BatchState {
  isRunning: boolean;
  done: number;
  total: number;
  error: string | null;
  completed: boolean;
}

interface TldBatchCheckParams {
  domains: Array<{ id: string; domain: string }>;
  tlds: string[];
  userId: string;
  scope: "all" | "page";
}

/** How many domains to check in parallel (each parallel check has its own pools). */
const DOMAIN_CONCURRENCY = 2;
/** Per-domain TLD pool for each resolver when running in parallel. */
const TLD_CONCURRENCY = 15;

async function runWithConcurrency<T>(
  items: T[],
  worker: (item: T, index: number) => Promise<void>,
  concurrency: number,
  isAborted: () => boolean
): Promise<void> {
  if (items.length === 0) return;

  let nextIndex = 0;
  let inFlight = 0;

  return new Promise<void>((resolve) => {
    const startNext = () => {
      while (nextIndex < items.length && inFlight < concurrency && !isAborted()) {
        const idx = nextIndex++;
        inFlight++;

        worker(items[idx], idx)
          .catch(() => {})
          .finally(() => {
            inFlight--;
            if (inFlight === 0 && nextIndex >= items.length) {
              resolve();
            } else {
              startNext();
            }
          });
      }
    };

    startNext();

    if (inFlight === 0 && nextIndex >= items.length) {
      resolve();
    }
  });
}

/**
 * Checks one domain's TLD list split across both DoH providers at the same
 * time (half via Cloudflare, half via Google) to halve wall-clock time, while
 * keeping per-provider concurrency at TLD_CONCURRENCY.
 */
async function checkDomainDualResolver(
  root: string,
  tlds: string[],
  options: { signal?: AbortSignal; concurrency: number }
) {
  const half = Math.ceil(tlds.length / 2);
  const [cloudflareResults, googleResults] = await Promise.all([
    checkAllExtensionsForRoot(root, tlds.slice(0, half), "cloudflare", options),
    checkAllExtensionsForRoot(root, tlds.slice(half), "google", options),
  ]);
  return [...cloudflareResults, ...googleResults];
}

export function useTldBatchCheck() {
  const supabase = useRef(createClient());
  const [state, setState] = useState<BatchState>({
    isRunning: false,
    done: 0,
    total: 0,
    error: null,
    completed: false,
  });
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(
    async (params: TldBatchCheckParams) => {
      const { domains, tlds, userId, scope } = params;

      if (state.isRunning || domains.length === 0 || tlds.length === 0) return;

      const controller = new AbortController();
      abortRef.current = controller;
      const isAborted = () => controller.signal.aborted;

      const total = domains.length * tlds.length;

      setState({
        isRunning: true,
        done: 0,
        total,
        error: null,
        completed: false,
      });

      let pairDone = 0;
      const reportEntries: TldReportEntry[] = [];

      try {
        await runWithConcurrency(
          domains,
          async (domain) => {
            if (isAborted()) return;

            const root = extractRootWord(domain.domain);

            // Snapshot the previous website state before overwriting rows so we
            // can diff new TLDs / deleted websites for the report.
            const { data: previousRows } = await fetchExtensionChecks(
              supabase.current as unknown as Record<string, unknown>,
              domain.id
            );
            const previousReserved = new Map<string, boolean>();
            for (const row of (previousRows ?? []) as Array<{
              tld: string;
              is_reserved: boolean | null;
              is_live: boolean | null;
            }>) {
              if (row.is_reserved === true) {
                previousReserved.set(row.tld, row.is_live === true);
              }
            }

            const results = await checkDomainDualResolver(root, tlds, {
              signal: controller.signal,
              concurrency: TLD_CONCURRENCY,
            });

            if (isAborted()) return;

            await persistResults(
              supabase.current as unknown as Record<string, unknown>,
              domain.id,
              userId,
              results
            );

            if (isAborted()) return;

            const entry: TldReportEntry = {
              domain: domain.domain,
              newTlds: [],
              deletedWebsites: [],
            };
            for (const result of results) {
              const wasReserved = previousReserved.has(result.tld);
              const wasLive = previousReserved.get(result.tld) === true;
              if (result.isReserved && !wasReserved) {
                entry.newTlds.push({
                  fullDomain: result.fullDomain,
                  isLive: result.isLive,
                });
              } else if (wasLive && !result.isLive && !result.error) {
                entry.deletedWebsites.push(result.fullDomain);
              }
            }
            reportEntries.push(entry);

            pairDone += tlds.length;
            setState((prev) => ({ ...prev, done: pairDone }));
          },
          DOMAIN_CONCURRENCY,
          isAborted
        );
      } catch (err: unknown) {
        if (isAborted()) return;
        setState((prev) => ({
          ...prev,
          isRunning: false,
          error: err instanceof Error ? err.message : "Sync failed",
        }));
        return;
      }

      const completed = !isAborted();

      if (completed && reportEntries.length > 0) {
        const report: TldReport = {
          generatedAt: new Date().toISOString(),
          scope,
          domainCount: reportEntries.length,
          tldCount: tlds.length,
          entries: reportEntries,
        };
        saveReportToCache(report, buildReportText(report));
      }

      setState({
        isRunning: false,
        done: pairDone,
        total,
        error: null,
        completed,
      });
    },
    [state.isRunning]
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState((prev) => ({
      ...prev,
      isRunning: false,
      completed: false,
    }));
  }, []);

  return { ...state, run, cancel };
}
