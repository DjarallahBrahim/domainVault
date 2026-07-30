"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { TldCheckResult } from "@/lib/tld/types";
import { checkAvailabilityBatch } from "@/lib/tld/resolve";
import { parseBaseWords } from "@/lib/tld/parseInput";

type FilterValue = "all" | "available" | "registered" | "reserved" | "error";

const DEFAULT_TLDS = ["com", "net", "org", "io", "ai", "co", "app", "dev"];

const SESSION_STORAGE_KEY = "tld-checker-selected-tlds";

interface TldCheckerState {
  rawInput: string;
  setRawInput: (value: string) => void;
  parsedWords: string[];
  parseError: string | null;
  selectedTlds: string[];
  toggleTld: (tld: string) => void;
  addCustomTld: (tld: string) => void;
  results: TldCheckResult[];
  isLoading: boolean;
  filter: FilterValue;
  setFilter: (f: FilterValue) => void;
  filteredResults: TldCheckResult[];
  counts: { all: number; available: number; registered: number; reserved: number; error: number };
  progress: { done: number; total: number };
  canCheck: boolean;
  checkAll: () => void;
  cancelAll: () => void;
  buildCsv: () => string;
}

function matchesFilter(
  result: TldCheckResult,
  filter: FilterValue
): boolean {
  if (filter === "all") return true;
  return result.status === filter;
}

function loadTlds(): string[] {
  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return [...DEFAULT_TLDS];
}

function escCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function useTldChecker(): TldCheckerState {
  const [rawInput, setRawInput] = useState("");
  const [parsedWords, setParsedWords] = useState<string[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [selectedTlds, setSelectedTlds] = useState<string[]>(loadTlds);
  const [results, setResults] = useState<TldCheckResult[]>([]);
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
      const parsed = parseBaseWords(text);

      if ("error" in parsed) {
        setParseError(parsed.error);
        setParsedWords([]);
      } else {
        setParseError(null);
        setParsedWords(parsed.words);
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

  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(selectedTlds));
    } catch {
      // ignore
    }
  }, [selectedTlds]);

  const toggleTld = useCallback((tld: string) => {
    setSelectedTlds((prev) => {
      const exists = prev.includes(tld);
      if (exists) {
        return prev.filter((t) => t !== tld);
      }
      return [...prev, tld];
    });
  }, []);

  const addCustomTld = useCallback((tld: string) => {
    const cleaned = tld.replace(/^\.+/, "").replace(/[^a-zA-Z0-9-]/g, "").toLowerCase();
    if (!cleaned) return;

    setSelectedTlds((prev) => {
      if (prev.includes(cleaned)) return prev;
      return [...prev, cleaned];
    });
  }, []);

  const checkAll = useCallback(() => {
    if (isLoading || parsedWords.length === 0 || parseError || selectedTlds.length === 0) {
      return;
    }

    const domains: string[] = [];
    for (const word of parsedWords) {
      for (const tld of selectedTlds) {
        domains.push(`${word}.${tld}`);
      }
    }

    setIsLoading(true);
    setResults([]);
    setProgress({ done: 0, total: domains.length });

    try {
      window.dispatchEvent(
        new CustomEvent("tld_check_run", {
          detail: {
            wordCount: parsedWords.length,
            tldCount: selectedTlds.length,
            totalCombinations: domains.length,
            timestamp: Date.now(),
          },
        })
      );
    } catch {
      // ignore
    }

    const controller = new AbortController();
    abortRef.current = controller;

    checkAvailabilityBatch(domains, {
      concurrency: 20,
      signal: controller.signal,
    }).then((batchResults) => {
      if (!controller.signal.aborted) {
        setResults(batchResults);
        setProgress({ done: batchResults.length, total: domains.length });
      }
      setIsLoading(false);
      abortRef.current = null;
    }).catch(() => {
      setIsLoading(false);
      abortRef.current = null;
    });
  }, [isLoading, parsedWords, parseError, selectedTlds]);

  const cancelAll = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsLoading(false);
  }, []);

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
        parsedWords.length > 0 &&
        !parseError &&
        selectedTlds.length > 0
      ) {
        e.preventDefault();
        checkAll();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isLoading, parsedWords, parseError, selectedTlds.length, checkAll]);

  const filteredResults = useMemo(
    () => results.filter((r) => matchesFilter(r, filter)),
    [results, filter]
  );

  const counts = useMemo(() => {
    return {
      all: results.length,
      available: results.filter((r) => r.status === "available").length,
      registered: results.filter((r) => r.status === "registered").length,
      reserved: results.filter((r) => r.status === "reserved").length,
      error: results.filter((r) => r.status === "error").length,
    };
  }, [results]);

  const canCheck =
    parsedWords.length > 0 && !isLoading && !parseError && selectedTlds.length > 0;

  const buildCsv = useCallback((): string => {
    const rows = filteredResults;
    const header = "word,tld,domain,status";
    const lines = rows.map((r) =>
      [
        escCsv(r.word),
        escCsv(r.tld),
        escCsv(r.domain),
        r.status,
      ].join(",")
    );
    return [header, ...lines].join("\n");
  }, [filteredResults]);

  return {
    rawInput,
    setRawInput,
    parsedWords,
    parseError,
    selectedTlds,
    toggleTld,
    addCustomTld,
    results,
    isLoading,
    filter,
    setFilter,
    filteredResults,
    counts,
    progress,
    canCheck,
    checkAll,
    cancelAll,
    buildCsv,
  };
}
