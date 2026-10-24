"use client";

import { AfternicCell } from "@/components/domains/AfternicCell";
import type { AfternicListing } from "@/types/afternic";

interface AfternicCardRowProps {
  listing: AfternicListing | undefined;
  onEdit: (listing: AfternicListing) => void;
  onCreate: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  onLogSale?: (listing: AfternicListing) => void;
}

export function AfternicCardRow(props: AfternicCardRowProps) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-text-muted">Afternic</span>
      <AfternicCell {...props} />
    </div>
  );
}
