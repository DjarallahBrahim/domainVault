"use client";

import { AtomCell } from "@/components/domains/AtomCell";
import type { AtomListing } from "@/types/atom";

interface AtomCardRowProps {
  listing: AtomListing | undefined;
  onEdit: (listing: AtomListing) => void;
  onCreate: () => void;
  onRefresh: () => void;
  refreshing: boolean;
}

export function AtomCardRow(props: AtomCardRowProps) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-text-muted">Atom</span>
      <AtomCell {...props} />
    </div>
  );
}
