"use client";

import { Pencil, Plus, RefreshCw } from "lucide-react";
import type { SedoListing } from "@/types/sedo";

interface SedoCellProps {
  listing: SedoListing | undefined;
  onEdit: (listing: SedoListing) => void;
  onCreate: () => void;
  onRefresh: () => void;
  refreshing: boolean;
}

export function SedoCell({ listing, onEdit, onCreate, onRefresh, refreshing }: SedoCellProps) {
  if (!listing) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-text-muted">Not Listed</span>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
          title="Check Sedo status"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
        </button>
        <button
          onClick={onCreate}
          className="text-text-muted hover:text-accent-success transition-colors"
          title="List on Sedo"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-mono text-accent-success">
        ${listing.sedo_price.toLocaleString()}
      </span>
      <button
        onClick={onRefresh}
        disabled={refreshing}
        className="text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
        title="Sync from Sedo"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
      </button>
      <button
        onClick={() => onEdit(listing)}
        className="text-text-muted hover:text-accent-primary transition-colors"
        title="Edit Sedo listing"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
