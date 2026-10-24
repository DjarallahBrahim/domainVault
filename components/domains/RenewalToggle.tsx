"use client";

import { useState, useCallback } from "react";
import { Star, StarOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { Tooltip } from "@/components/ui/tooltip";

interface RenewalToggleProps {
  domainId: string;
  toBeRenewal: boolean | null;
}

const CYCLE: Array<boolean | null> = [null, true, false];

export function RenewalToggle({ domainId, toBeRenewal }: RenewalToggleProps) {
  const queryClient = useQueryClient();
  const [localValue, setLocalValue] = useState<boolean | null>(toBeRenewal);

  const handleClick = useCallback(async () => {
    const currentIdx = CYCLE.indexOf(localValue);
    const nextValue = CYCLE[(currentIdx + 1) % CYCLE.length];

    // Update local state immediately
    setLocalValue(nextValue);

    // Persist to DB
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient();
    await (supabase as any).from("domains").update({ to_be_renewal: nextValue }).eq("id", domainId);

    // Invalidate queries to refresh data on next page load
    queryClient.invalidateQueries({ queryKey: queryKeys.domains.all });
  }, [domainId, localValue, queryClient]);

  const value = localValue;

  if (value === true) {
    return (
      <Tooltip content="Will renew — click to change">
        <button
          type="button"
          onClick={handleClick}
          aria-label="Will renew — click to change"
          className="inline-flex items-center text-yellow-400 transition-colors hover:text-yellow-300"
        >
          <Star className="h-4 w-4 fill-yellow-400" />
        </button>
      </Tooltip>
    );
  }

  if (value === false) {
    return (
      <Tooltip content="Will not renew — click to change">
        <button
          type="button"
          onClick={handleClick}
          aria-label="Will not renew — click to change"
          className="inline-flex items-center text-muted-foreground/40 transition-colors hover:text-muted-foreground"
        >
          <StarOff className="h-4 w-4" />
        </button>
      </Tooltip>
    );
  }

  return (
    <Tooltip content="Not decided — click to choose">
      <button
        type="button"
        onClick={handleClick}
        aria-label="Not decided — click to choose"
        className="inline-flex items-center text-muted-foreground transition-colors hover:text-yellow-400"
      >
        <Star className="h-4 w-4" />
      </button>
    </Tooltip>
  );
}
