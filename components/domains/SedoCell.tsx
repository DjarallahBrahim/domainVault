"use client";

import { Pencil, Plus, RefreshCw } from "lucide-react";
import type { SedoListing } from "@/types/sedo";
import { Tooltip } from "@/components/ui/tooltip";

interface SedoCellProps {
  listing: SedoListing | undefined;
  onEdit: (listing: SedoListing) => void;
  onCreate: () => void;
  onRefresh: () => void;
  refreshing: boolean;
}

export function SedoCell({ listing, onEdit, onCreate, onRefresh, refreshing }: SedoCellProps) {
  const refreshButton = (
    <Tooltip content="Sync from Sedo">
      <button
        onClick={onRefresh}
        disabled={refreshing}
        className="text-text-muted transition-colors hover:text-text-primary disabled:opacity-50"
        aria-label="Sync from Sedo"
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
        <Tooltip content="List on Sedo">
          <button
            onClick={onCreate}
            className="text-text-muted transition-colors hover:text-accent-success"
            aria-label="List on Sedo"
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
        ${listing.sedo_price.toLocaleString()}
      </span>
      {refreshButton}
      <Tooltip content="Edit Sedo listing">
        <button
          onClick={() => onEdit(listing)}
          className="text-text-muted transition-colors hover:text-accent-primary"
          aria-label="Edit Sedo listing"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </Tooltip>
    </div>
  );
}
