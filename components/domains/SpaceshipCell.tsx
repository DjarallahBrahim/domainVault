"use client";

import { Pencil, Plus, RefreshCw } from "lucide-react";
import type { SpaceshipListing } from "@/types/spaceship";

interface SpaceshipCellProps {
  listing: SpaceshipListing | undefined;
  onEdit: (listing: SpaceshipListing) => void;
  onCreate: () => void;
  onRefresh: () => void;
  refreshing: boolean;
}

export function SpaceshipCell({ listing, onEdit, onCreate, onRefresh, refreshing }: SpaceshipCellProps) {
  if (!listing) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-text-muted">Not Listed</span>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
          title="Check Spaceship status"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
        </button>
        <button
          onClick={onCreate}
          className="text-text-muted hover:text-accent-success transition-colors"
          title="List on Spaceship"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-mono text-accent-success">
        ${listing.spaceship_price ? listing.spaceship_price.toLocaleString() : "0"}
      </span>
      <button
        onClick={onRefresh}
        disabled={refreshing}
        className="text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
        title="Sync from Spaceship"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
      </button>
      <button
        onClick={() => onEdit(listing)}
        className="text-text-muted hover:text-accent-primary transition-colors"
        title="Edit Spaceship listing"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
