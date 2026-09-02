"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { SearchX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-keys";

async function fetchActiveTldCount(): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("tld_extensions")
    .select("extension", { count: "exact", head: true })
    .eq("is_active", true);
  if (error) throw error;
  return count ?? 0;
}

interface RunTldCheckPromptProps {
  domainId: string;
  domainName: string;
  variant: "neverChecked" | "isEmpty";
  tldsChecked?: number;
  onSuccess: () => void;
}

export function RunTldCheckPrompt({
  domainId,
  domainName,
  variant,
  tldsChecked,
  onSuccess,
}: RunTldCheckPromptProps) {
  const [running, setRunning] = React.useState(false);

  const { data: activeTldCount, isLoading: loadingTldCount } = useQuery({
    queryKey: queryKeys.promoting.activeTlds(),
    queryFn: fetchActiveTldCount,
    staleTime: 5 * 60 * 1000,
  });

  const noTldList = !loadingTldCount && activeTldCount === 0;

  const run = async () => {
    setRunning(true);
    try {
      const response = await fetch(`/api/tld-checker/domains/${domainId}/refresh`, {
        method: "POST",
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error ?? "TLD check failed. Try again.");
      }
      toast.success("TLD check complete");
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "TLD check failed. Try again.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-bg-surface px-6 py-14 text-center">
      <SearchX className="h-10 w-10 text-text-muted" />
      {variant === "neverChecked" ? (
        <>
          <p className="text-lg font-medium text-text-primary">No TLD data yet for {domainName}</p>
          <p className="max-w-md text-sm text-text-muted">
            Run a check to see which extensions are already reserved.
          </p>
        </>
      ) : (
        <>
          <p className="text-lg font-medium text-text-primary">
            No reserved TLDs found for {domainName}
          </p>
          <p className="max-w-md text-sm text-text-muted">
            Checked {tldsChecked ?? "—"} extensions. Nothing is reserved right now.
          </p>
        </>
      )}
      {loadingTldCount ? (
        <Skeleton className="mt-2 h-9 w-36" />
      ) : (
        <Button
          className="mt-2"
          disabled={running || noTldList}
          onClick={run}
          title={noTldList ? "No TLD list configured yet." : undefined}
        >
          {running ? "Checking…" : variant === "neverChecked" ? "Run TLD Check" : "Re-check"}
        </Button>
      )}
    </div>
  );
}
