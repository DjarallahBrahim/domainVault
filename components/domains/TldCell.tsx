"use client";

import { useState, useCallback } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RefreshCw, ChevronDown } from "lucide-react";
import { TldDropdown } from "./TldDropdown";
import { cn } from "@/lib/utils";

interface TldCellProps {
  domainId: string;
  domainName: string;
  reservedTldsCount: number | null;
  reservedExtensions: string[];
}

export function TldCell({
  domainId,
  domainName,
  reservedTldsCount,
  reservedExtensions: initialExtensions,
}: TldCellProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [localCount, setLocalCount] = useState<number | null>(reservedTldsCount);
  const [localExtensions, setLocalExtensions] = useState<string[]>(initialExtensions);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const extensions = localExtensions.length > 0 ? localExtensions : initialExtensions;
  const count = localCount ?? 0;

  const handleRefresh = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const res = await fetch(
        `/api/tld-checker/domains/${domainId}/refresh`,
        { method: "POST" }
      );

      if (res.ok) {
        const { data } = await res.json();
        const newCount = data?.reservedTldsCount ?? 0;
        const results = (data?.results ?? []) as Array<{ tld: string; isReserved: boolean }>;
        const reserved = results.filter((r) => r.isReserved).map((r) => r.tld);

        setLocalCount(newCount);
        setLocalExtensions(reserved);
      }
    } catch {
      // revert on error
    } finally {
      setIsLoading(false);
    }
  }, [domainId, isLoading]);

  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={handleRefresh}
        className="inline-flex items-center text-muted-foreground hover:text-accent-primary transition-colors"
        title="Refresh TLDs"
      >
        <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
      </button>
      {count > 0 && (
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-mono border transition-colors cursor-pointer",
                "bg-accent-warning/10 border-accent-warning/30 text-accent-warning"
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
              reservedExtensions={extensions}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
