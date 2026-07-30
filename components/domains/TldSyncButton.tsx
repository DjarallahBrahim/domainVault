"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useJobProgress } from "@/lib/hooks/useJobProgress";
import { RefreshCw } from "lucide-react";

interface TldSyncButtonProps {
  variant?: "full" | "icon";
}

export function TldSyncButton({ variant = "full" }: TldSyncButtonProps) {
  const [jobId, setJobId] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  const { progress, status, processedPairs, totalPairs, error } =
    useJobProgress(jobId);

  const isRunning =
    status === "running" || status === "queued" || isRequesting;
  const isComplete = status === "completed";
  const isFailed = status === "failed";

  const handleSync = useCallback(async () => {
    if (isRunning) return;

    setIsRequesting(true);
    try {
      const res = await fetch("/api/tld-checker/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "all" }),
      });

      if (res.status === 409) {
        // Already running — poll existing job
        const pollRes = await fetch(
          "/api/tld-checker/jobs?_poll=true"
        );
        if (pollRes.ok) {
          const { data } = await pollRes.json();
          if (data?.jobId) setJobId(data.jobId);
        }
        setIsRequesting(false);
        return;
      }

      if (res.ok) {
        const { data } = await res.json();
        setJobId(data.jobId);
      }
    } catch {
      // ignore
    } finally {
      setIsRequesting(false);
    }
  }, [isRunning]);

  const handleReset = useCallback(() => {
    setJobId(null);
  }, []);

  if (isComplete && variant === "full") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-accent-success font-mono">
          Sync complete ({totalPairs} pairs)
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="font-mono text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Sync Again
        </Button>
      </div>
    );
  }

  if (isFailed && variant === "full") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-accent-danger font-mono">
          {error ? error.slice(0, 80) : "Sync failed"}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="font-mono text-xs"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (isRunning) {
    const pct = Math.round(progress * 100);
    if (variant === "icon") {
      return (
        <Button
          disabled
          size="sm"
          variant="outline"
          className="font-mono text-xs"
        >
          <RefreshCw className="h-4 w-4 animate-spin" />
        </Button>
      );
    }

    return (
      <Button disabled size="default" className="font-mono text-xs">
        <RefreshCw className="h-4 w-4 animate-spin mr-1.5" />
        Syncing... {processedPairs}/{totalPairs} ({pct}%)
      </Button>
    );
  }

  if (variant === "icon") {
    return (
      <Button
        onClick={handleSync}
        size="sm"
        variant="outline"
        className="font-mono text-xs"
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button onClick={handleSync} size="default" className="font-mono text-xs">
      <RefreshCw className="h-4 w-4" />
      Sync All
    </Button>
  );
}
