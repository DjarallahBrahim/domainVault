"use client";

import { Pencil, Plus } from "lucide-react";
import type { SedoListing } from "@/types/sedo";

interface SedoCardRowProps {
  listing: SedoListing | undefined;
  onEdit: (listing: SedoListing) => void;
  onCreate: () => void;
}

export function SedoCardRow({ listing, onEdit, onCreate }: SedoCardRowProps) {
  if (!listing) {
    return (
      <div className="flex justify-between text-xs text-text-muted">
        <span>Sedo</span>
        <span className="flex items-center gap-1">
          Not Listed
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
