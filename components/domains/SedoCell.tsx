"use client";

import { Pencil, Plus } from "lucide-react";
import type { SedoListing } from "@/types/sedo";

interface SedoCellProps {
  listing: SedoListing | undefined;
  onEdit: (listing: SedoListing) => void;
  onCreate: () => void;
}

export function SedoCell({ listing, onEdit, onCreate }: SedoCellProps) {
  if (!listing) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-text-muted">Not Listed</span>
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
        onClick={() => onEdit(listing)}
        className="text-text-muted hover:text-accent-primary transition-colors"
        title="Edit Sedo listing"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
