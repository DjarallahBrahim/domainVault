"use client";

import { useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { extractRootWord } from "@/lib/tld-checker/rootExtractor";
import { checkAllExtensionsForRoot } from "@/lib/tld-checker/checkExtensions";
import { persistResults } from "@/lib/tld-checker/persistResults";

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
}

/** How many domains to check in parallel (each parallel check has its own pool). */
const DOMAIN_CONCURRENCY = 2;
/** Per-domain TLD pool when running in parallel. */
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

  const run = useCallback(async (params: TldBatchCheckParams) => {
    const { domains, tlds, userId } = params;

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

    try {
      await runWithConcurrency(
        domains,
        async (domain) => {
          if (isAborted()) return;

          const root = extractRootWord(domain.domain);

          const results = await checkAllExtensionsForRoot(
            root,
            tlds,
            "cloudflare",
            { signal: controller.signal, concurrency: TLD_CONCURRENCY }
          );

          if (isAborted()) return;

          await persistResults(
            supabase.current as unknown as Record<string, unknown>,
            domain.id,
            userId,
            results
          );

          if (isAborted()) return;

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

    setState({
      isRunning: false,
      done: pairDone,
      total,
      error: null,
      completed: !isAborted(),
    });
  }, [state.isRunning]);

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
