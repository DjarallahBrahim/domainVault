"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchActiveTlds } from "@/lib/supabase/queries/tld-extensions";
import { extractRootWord } from "@/lib/tld-checker/rootExtractor";
import { checkAllExtensionsForRoot } from "@/lib/tld-checker/checkExtensions";
import { persistResults } from "@/lib/tld-checker/persistResults";
import type { ExtensionResult } from "@/lib/tld-checker/types";

export type TldReservedState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "ok";
      root: string;
      checked: number;
      reserved: ExtensionResult[];
    }
  | { status: "error"; message: string };

/**
 * Runs the existing TLD checker against a candidate domain's root word and
 * remembers the results so they can be persisted once the domain row exists.
 * Reuses the /domains TLD-check pipeline — no duplicated DNS logic.
 */
export function useTldReservedAnalysis() {
  const supabase = useRef(createClient());
  const abortRef = useRef<AbortController | null>(null);
  const resultsRef = useRef<ExtensionResult[] | null>(null);

  const [state, setState] = useState<TldReservedState>({ status: "idle" });

  const run = useCallback(async (domain: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ status: "loading" });

    try {
      const root = extractRootWord(domain);

      const { data, error } = await fetchActiveTlds(supabase.current);
      if (error) throw error;
      const tlds = ((data ?? []) as Array<{ extension: string }>).map(
        (r) => r.extension
      );
      if (tlds.length === 0) {
        throw new Error("No active TLDs configured");
      }

      const results = await checkAllExtensionsForRoot(root, tlds, "cloudflare", {
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      resultsRef.current = results;
      setState({
        status: "ok",
        root,
        checked: results.length,
        reserved: results.filter((r) => r.isReserved),
      });
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      resultsRef.current = null;
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "TLD check failed",
      });
    }
  }, []);

  const persistForDomain = useCallback(async (domainId: string) => {
    const results = resultsRef.current;
    if (!results || results.length === 0) return false;

    const {
      data: { user },
      error: userError,
    } = await supabase.current.auth.getUser();
    if (userError || !user) throw new Error("Not authenticated");

    await persistResults(supabase.current, domainId, user.id, results);
    return true;
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    resultsRef.current = null;
    setState({ status: "idle" });
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return { state, run, persistForDomain, reset };
}
