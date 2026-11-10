"use client";

import { useState, useCallback } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RefreshCw, ChevronDown } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { TldDropdown } from "./TldDropdown";
import { cn } from "@/lib/utils";
import { computeTldDiff } from "@/lib/tld-checker/tldDiff";
import type { TldDiff, TldStatus } from "@/lib/tld-checker/tldDiff";

interface TldCellProps {
  domainId: string;
  domainName: string;
  reservedTldsCount: number | null;
  reservedExtensions: TldStatus[];
  hasPreviousScan?: boolean;
}

export function TldCell({
  domainId,
  domainName,
  reservedTldsCount,
  reservedExtensions: initialExtensions,
  hasPreviousScan = true,
}: TldCellProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [localCount, setLocalCount] = useState<number | null>(reservedTldsCount);
  const [localStatuses, setLocalStatuses] = useState<TldStatus[] | null>(null);
  const [diff, setDiff] = useState<TldDiff | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const statuses = localStatuses ?? initialExtensions;
  const addedTlds = diff ? new Set(diff.added) : null;
  const removedTlds = diff?.removed ?? [];
  const count = localCount ?? 0;
  const allDropped = count === 0 && !isLoading && removedTlds.length > 0;

  const handleRefresh = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);

    const previousStatuses = localStatuses ?? initialExtensions;
    const canDiff = hasPreviousScan || previousStatuses.length > 0;

    try {
      const res = await fetch(`/api/tld-checker/domains/${domainId}/refresh`, { method: "POST" });

      if (res.ok) {
        const { data } = await res.json();
        const newCount = data?.reservedTldsCount ?? 0;
        const results = (data?.results ?? []) as Array<{
          tld: string;
          isReserved: boolean;
          isLive: boolean;
        }>;
        const nextStatuses: TldStatus[] = results
          .filter((r) => r.isReserved)
          .map((r) => ({ tld: r.tld, isLive: r.isLive }));

        setLocalCount(newCount);
        setLocalStatuses(nextStatuses);
        setDiff(canDiff ? computeTldDiff(previousStatuses, nextStatuses) : null);
      }
    } catch {
      // revert on error
    } finally {
      setIsLoading(false);
    }
  }, [domainId, isLoading, localStatuses, initialExtensions, hasPreviousScan]);

  return (
    <div className="inline-flex items-center gap-1">
      <Tooltip content="Re-check reserved TLDs">
        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex items-center text-muted-foreground transition-colors hover:text-accent-primary"
          aria-label="Re-check reserved TLDs"
        >
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
        </button>
      </Tooltip>
      {(count > 0 || allDropped) && (
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              title="View reserved TLDs"
              className={cn(
                "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-mono border transition-colors cursor-pointer",
                count > 0
                  ? "bg-accent-warning/10 border-accent-warning/30 text-accent-warning"
                  : "bg-muted border-border text-muted-foreground"
              )}
            >
              {count}
              <ChevronDown className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 p-0" align="start">
            <TldDropdown
              domainId={domainId}
              domainName={domainName}
              open={dropdownOpen}
              reservedExtensions={statuses}
              addedTlds={addedTlds}
              removedTlds={removedTlds}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
