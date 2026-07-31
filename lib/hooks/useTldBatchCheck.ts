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

    if (state.isRunning) return;

    const controller = new AbortController();
    abortRef.current = controller;

    setState({
      isRunning: true,
      done: 0,
      total: domains.length * tlds.length,
      error: null,
      completed: false,
    });

    let pairDone = 0;

    try {
      for (let i = 0; i < domains.length; i++) {
        if (controller.signal.aborted) break;

        const domain = domains[i];
        const root = extractRootWord(domain.domain);

        const results = await checkAllExtensionsForRoot(
          root,
          tlds,
          "cloudflare",
          { signal: controller.signal }
        );

        if (controller.signal.aborted) break;

        await persistResults(
          supabase.current as unknown as Record<string, unknown>,
          domain.id,
          userId,
          results
        );

        pairDone += tlds.length;
        setState((prev) => ({ ...prev, done: pairDone }));
      }
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
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
      total: domains.length * tlds.length,
      error: null,
      completed: !controller.signal.aborted,
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
