"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface JobProgress {
  status: string | null;
  processedPairs: number;
  totalPairs: number;
  error: string | null;
}

function useSupabaseClient() {
  const ref = useRef<ReturnType<typeof createClient> | null>(null);
  if (!ref.current) ref.current = createClient();
  return ref.current;
}

export function useJobProgress(jobId: string | null) {
  const [progress, setProgress] = useState<JobProgress>({
    status: null,
    processedPairs: 0,
    totalPairs: 0,
    error: null,
  });

  const supabase = useSupabaseClient();
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateFromRow = useCallback((row: Record<string, unknown>) => {
    setProgress({
      status: (row.status as string) ?? null,
      processedPairs: (row.processed_pairs as number) ?? 0,
      totalPairs: (row.total_pairs as number) ?? 0,
      error: (row.error as string) ?? null,
    });
  }, []);

  useEffect(() => {
    if (!jobId) return;

    let reconnected = false;

    const channel = supabase
      .channel(`tld-job-${jobId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tld_check_jobs",
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          updateFromRow(payload.new as Record<string, unknown>);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED" && !reconnected) {
          reconnected = true;
        }
      });

    const pollTimeout = setTimeout(() => {
      if (!reconnected && channel.state !== "joined") {
        channel.unsubscribe();
        startPolling();
      }
    }, 5000);

    function startPolling() {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/tld-checker/jobs/${jobId}`);
          if (res.ok) {
            const { data } = await res.json();
            if (data) updateFromRow(data);
            if (
              data?.status === "completed" ||
              data?.status === "failed" ||
              data?.status === "cancelled"
            ) {
              stopPolling();
            }
          }
        } catch {
          // ignore polling errors
        }
      }, 3000);

      pollingRef.current = interval;
    }

    function stopPolling() {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }

    return () => {
      clearTimeout(pollTimeout);
      supabase.removeChannel(channel);
      stopPolling();
    };
  }, [jobId, supabase, updateFromRow]);

  return {
    progress: progress.totalPairs > 0
      ? progress.processedPairs / progress.totalPairs
      : 0,
    status: progress.status,
    processedPairs: progress.processedPairs,
    totalPairs: progress.totalPairs,
    error: progress.error,
  };
}
