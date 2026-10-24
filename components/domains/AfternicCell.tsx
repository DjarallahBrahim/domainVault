"use client";

import {
  CheckCircle2,
  Clock,
  EyeOff,
  Lock,
  PauseCircle,
  Pencil,
  Plus,
  RefreshCw,
  XCircle,
  Zap,
} from "lucide-react";
import type { AfternicListing } from "@/types/afternic";
import { FAST_TRANSFER_ICON_CLASS, getFastTransferInfo } from "@/lib/afternic/fast-transfer";
import { Tooltip } from "@/components/ui/tooltip";

interface AfternicCellProps {
  listing: AfternicListing | undefined;
  onEdit: (listing: AfternicListing) => void;
  onCreate: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  onLogSale?: (listing: AfternicListing) => void;
}

function formatPrice(value: number | null | undefined): string {
  return `$${Number(value ?? 0).toLocaleString("en-US")}`;
}

export function AfternicCell({
  listing,
  onEdit,
  onCreate,
  onRefresh,
  refreshing,
  onLogSale,
}: AfternicCellProps) {
  const ft = getFastTransferInfo(listing?.fast_transfer_status);

  const ftIcon = ft ? (
    <Tooltip content={ft.hint}>
      <span aria-label={`Fast Transfer: ${ft.label}`} className="inline-flex items-center">
        <Zap className={`h-3.5 w-3.5 ${FAST_TRANSFER_ICON_CLASS[ft.tone]}`} aria-hidden />
      </span>
    </Tooltip>
  ) : null;

  const refreshButton = (
    <Tooltip content="Sync from Afternic">
      <button
        onClick={onRefresh}
        disabled={refreshing}
        className="text-text-muted transition-colors hover:text-text-primary disabled:opacity-50"
        aria-label="Sync from Afternic"
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
        <Tooltip content="List on Afternic">
          <button
            onClick={onCreate}
            className="text-text-muted transition-colors hover:text-accent-success"
            aria-label="List on Afternic"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </Tooltip>
      </div>
    );
  }

  const editButton =
    listing.list_status === "ON_HOLD" || listing.list_status === "SOLD" ? null : (
      <Tooltip content="Edit Afternic listing">
        <button
          onClick={() => onEdit(listing)}
          className="text-text-muted transition-colors hover:text-accent-primary"
          aria-label="Edit Afternic listing"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </Tooltip>
    );

  if (listing.list_status === "ON_HOLD") {
    return (
      <div className="flex items-center gap-1.5">
        <span className="flex items-center gap-1 text-sm text-accent-warning">
          <Tooltip content="Transaction in progress — editing is disabled">
            <Lock className="h-3.5 w-3.5" />
          </Tooltip>
          On hold
        </span>
        {refreshButton}
      </div>
    );
  }

  if (listing.list_status === "SOLD") {
    return (
      <div className="flex items-center gap-1.5">
        <span className="flex items-center gap-1 text-sm text-accent-success">
          <Tooltip content="Sold on Afternic">
            <CheckCircle2 className="h-3.5 w-3.5" />
          </Tooltip>
          Sold
        </span>
        {onLogSale && (
          <button
            onClick={() => onLogSale(listing)}
            className="text-[11px] text-accent-primary hover:underline"
          >
            Log sale
          </button>
        )}
        {refreshButton}
      </div>
    );
  }

  if (listing.list_status === "PENDING") {
    return (
      <div className="flex items-center gap-1.5">
        <span className="flex items-center gap-1 text-sm text-accent-warning">
          <Tooltip content="Listing is pending Afternic review">
            <Clock className="h-3.5 w-3.5" />
          </Tooltip>
          Pending
        </span>
        {ftIcon}
        {refreshButton}
        {editButton}
      </div>
    );
  }

  if (listing.list_status === "FAILED_COMPLIANCE") {
    return (
      <div className="flex items-center gap-1.5">
        <span className="flex items-center gap-1 text-sm text-accent-danger">
          <Tooltip content="Listing failed compliance — edit it to retry">
            <XCircle className="h-3.5 w-3.5" />
          </Tooltip>
          Failed
        </span>
        {ftIcon}
        {refreshButton}
        {editButton}
      </div>
    );
  }

  if (listing.list_status === "HIDDEN") {
    return (
      <div className="flex items-center gap-1.5">
        <span className="flex items-center gap-1 text-sm text-text-muted">
          <Tooltip content="Hidden from the marketplace">
            <EyeOff className="h-3.5 w-3.5" />
          </Tooltip>
          <span className="font-mono">{formatPrice(listing.buynow_price)}</span>
        </span>
        {ftIcon}
        {refreshButton}
        {editButton}
      </div>
    );
  }

  if (listing.list_status === "INACTIVE") {
    return (
      <div className="flex items-center gap-1.5">
        <span className="flex items-center gap-1 text-sm text-text-muted">
          <Tooltip content="Listing is inactive">
            <PauseCircle className="h-3.5 w-3.5" />
          </Tooltip>
          Inactive
        </span>
        {ftIcon}
        {refreshButton}
        {editButton}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-sm text-accent-success">
        {formatPrice(listing.buynow_price)}
      </span>
      {ftIcon}
      {refreshButton}
      {editButton}
    </div>
  );
}
