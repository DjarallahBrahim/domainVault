"use client";

import { CheckCircle2, Pencil, Plus, RefreshCw, XCircle } from "lucide-react";
import type { AtomListing, AtomListingType } from "@/types/atom";
import { Tooltip } from "@/components/ui/tooltip";

interface AtomCellProps {
  listing: AtomListing | undefined;
  onEdit: (listing: AtomListing) => void;
  onCreate: () => void;
  onRefresh: () => void;
  refreshing: boolean;
}

function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `$${Math.round(Number(value)).toLocaleString("en-US")}`;
}

export function atomStatusTone(
  status: string | null | undefined
): "success" | "warning" | "danger" | "muted" {
  const value = String(status ?? "").toLowerCase();
  if (value.includes("transfer complete") || value.includes("sold")) return "success";
  if (
    value.includes("approved") ||
    value.includes("live") ||
    value.includes("active") ||
    value.includes("complete")
  ) {
    return "success";
  }
  if (value.includes("pending") || value.includes("review") || value.includes("processing")) {
    return "warning";
  }
  if (value.includes("reject") || value.includes("fail") || value.includes("removed")) {
    return "danger";
  }
  return "muted";
}

export function atomTypeHint(type: AtomListingType): string {
  if (type === "premium") {
    return "Premium listing · remove from the Atom dashboard (30-day notice)";
  }
  if (type === "geo") {
    return "Geo listing · remove from the Atom dashboard";
  }
  if (type === "plus") {
    return "Plus listing · removable via the API";
  }
  return "Standard listing · removable via the API";
}

export function isAtomEditable(listing: AtomListing | undefined): boolean {
  if (!listing) return false;
  const status = String(listing.list_status ?? "").toLowerCase();
  return !status.includes("transfer complete") && !status.includes("sold");
}

export function AtomCell({ listing, onEdit, onCreate, onRefresh, refreshing }: AtomCellProps) {
  const refreshButton = (
    <Tooltip content="Sync from Atom">
      <button
        onClick={onRefresh}
        disabled={refreshing}
        className="text-text-muted transition-colors hover:text-text-primary disabled:opacity-50"
        aria-label="Sync from Atom"
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
        <Tooltip content="List on Atom">
          <button
            onClick={onCreate}
            className="text-text-muted transition-colors hover:text-accent-success"
            aria-label="List on Atom"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </Tooltip>
      </div>
    );
  }

  const tone = atomStatusTone(listing.list_status);
  const toneClass =
    tone === "success"
      ? "text-accent-success"
      : tone === "warning"
        ? "text-accent-warning"
        : tone === "danger"
          ? "text-accent-danger"
          : "text-text-muted";

  return (
    <div className="flex items-center gap-1.5">
      <Tooltip content={`${listing.list_status} · ${atomTypeHint(listing.listing_type)}`}>
        <span className={`flex items-center gap-1 text-sm ${toneClass}`}>
          {tone === "danger" ? (
            <XCircle className="h-3.5 w-3.5" aria-hidden />
          ) : tone === "success" ? (
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
          ) : null}
          <span className="font-mono">{formatPrice(listing.selling_price)}</span>
        </span>
      </Tooltip>
      {isAtomEditable(listing) && (
        <Tooltip content="Edit Atom listing">
          <button
            onClick={() => onEdit(listing)}
            className="text-text-muted transition-colors hover:text-accent-primary"
            aria-label="Edit Atom listing"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </Tooltip>
      )}
      {refreshButton}
    </div>
  );
}
