"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useTldBatchCheck } from "@/lib/hooks/useTldBatchCheck";
import { createClient } from "@/lib/supabase/client";
import { RefreshCw } from "lucide-react";

interface TldSyncButtonProps {
  variant?: "full" | "icon";
  scope?: "all" | "page";
  domainIds?: string[];
  domains?: Array<{ id: string; domain: string }>;
  userId: string;
}

export function TldSyncButton({
  variant = "full",
  scope = "all",
  domainIds = [],
  domains = [],
  userId,
}: TldSyncButtonProps) {
  const { isRunning, done, total, error, run, cancel } =
    useTldBatchCheck();

  const [finished, setFinished] = useState(false);

  const resolvedDomains = scope === "page" && domainIds.length > 0
    ? domains.filter((d) => domainIds.includes(d.id))
    : domains;

  const handleSync = useCallback(async () => {
    if (isRunning) return;

    const supabase = createClient();
    const { data: tldRows } = await supabase
      .from("tld_extensions")
      .select("extension")
      .eq("is_active", true)
      .order("sort_order");

    const tlds = (tldRows as Array<{ extension: string }> ?? [])
      .map((r) => r.extension);

    if (tlds.length === 0) return;

    setFinished(false);
    await run({ domains: resolvedDomains, tlds, userId });
    setFinished(true);
  }, [isRunning, resolvedDomains, userId, run]);

  const handleReset = useCallback(() => {
    setFinished(false);
  }, []);

  if (finished && !isRunning) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-accent-success font-mono">
          Sync complete ({done} pairs)
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

  if (error) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-accent-danger font-mono">
          {error.slice(0, 80)}
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
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    return (
      <Button disabled size="default" className="font-mono text-xs">
        <RefreshCw className="h-4 w-4 animate-spin mr-1.5" />
        Syncing... {done}/{total} ({pct}%)
        <Button
          variant="ghost"
          size="sm"
          onClick={cancel}
          className="font-mono text-xs ml-2 text-accent-danger hover:text-accent-danger"
        >
          Cancel
        </Button>
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
