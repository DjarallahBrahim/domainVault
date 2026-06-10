"use client";

import { Pencil, Plus, RefreshCw } from "lucide-react";
import type { SedoListing } from "@/types/sedo";

interface SedoCardRowProps {
  listing: SedoListing | undefined;
  onEdit: (listing: SedoListing) => void;
  onCreate: () => void;
  onRefresh: () => void;
  refreshing: boolean;
}

export function SedoCardRow({ listing, onEdit, onCreate, onRefresh, refreshing }: SedoCardRowProps) {
  if (!listing) {
    return (
      <div className="flex justify-between text-xs text-text-muted">
        <span>Sedo</span>
        <span className="flex items-center gap-1">
          Not Listed
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="hover:text-text-primary transition-colors disabled:opacity-50"
            title="Check Sedo status"
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={onCreate}
            className="hover:text-accent-success transition-colors"
            title="List on Sedo"
          >
            <Plus className="h-3 w-3" />
          </button>
        </span>
      </div>
    );
  }

  return (
    <div className="flex justify-between text-xs">
      <span className="text-text-muted">Sedo</span>
      <span className="flex items-center gap-1 text-accent-success font-mono">
        ${listing.sedo_price.toLocaleString()}
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
          title="Sync from Sedo"
        >
          <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
        </button>
        <button
          onClick={() => onEdit(listing)}
          className="text-text-muted hover:text-accent-primary transition-colors"
          title="Edit Sedo listing"
        >
          <Pencil className="h-3 w-3" />
        </button>
      </span>
    </div>
  );
}
