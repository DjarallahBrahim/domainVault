"use client";

import { Pencil, Plus, RefreshCw } from "lucide-react";
import type { SpaceshipListing } from "@/types/spaceship";
import { Tooltip } from "@/components/ui/tooltip";

interface SpaceshipCellProps {
  listing: SpaceshipListing | undefined;
  onEdit: (listing: SpaceshipListing) => void;
  onCreate: () => void;
  onRefresh: () => void;
  refreshing: boolean;
}

export function SpaceshipCell({
  listing,
  onEdit,
  onCreate,
  onRefresh,
  refreshing,
}: SpaceshipCellProps) {
  const refreshButton = (
    <Tooltip content="Sync from Spaceship">
      <button
        onClick={onRefresh}
        disabled={refreshing}
        className="text-text-muted transition-colors hover:text-text-primary disabled:opacity-50"
        aria-label="Sync from Spaceship"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
      </button>
    </Tooltip>
  );

  if (!listing) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-text-muted">Not Listed</span>
        {refreshButton}
        <Tooltip content="List on Spaceship">
          <button
            onClick={onCreate}
            className="text-text-muted transition-colors hover:text-accent-success"
            aria-label="List on Spaceship"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-mono text-accent-success">
        ${listing.spaceship_price ? listing.spaceship_price.toLocaleString() : "0"}
      </span>
      {refreshButton}
      <Tooltip content="Edit Spaceship listing">
        <button
          onClick={() => onEdit(listing)}
          className="text-text-muted transition-colors hover:text-accent-primary"
          aria-label="Edit Spaceship listing"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </Tooltip>
    </div>
  );
}
