"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DomainStatusBadge } from "@/components/domains/domain-status-badge";
import { DomainExpiryBadge } from "@/components/domains/domain-expiry-badge";
import { DomainRenewalBadge } from "@/components/domains/domain-renewal-badge";
import { SedoCell } from "@/components/domains/SedoCell";
import { SpaceshipCell } from "@/components/domains/SpaceshipCell";
import { AfternicCell } from "@/components/domains/AfternicCell";
import { TldCell } from "@/components/domains/TldCell";
import { RenewalToggle } from "@/components/domains/RenewalToggle";
import type { Database } from "@/types/supabase";
import type { SedoListing } from "@/types/sedo";
import type { SpaceshipListing } from "@/types/spaceship";
import type { AfternicListing } from "@/types/afternic";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ArrowUpDown, Pencil, RefreshCw } from "lucide-react";

type DomainRow = Database["public"]["Tables"]["domains"]["Row"];

interface DomainTableProps {
  domains: DomainRow[];
  total: number;
  page: number;
  totalPages: number;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onDelete: (id: string) => void;
  onEdit: (domain: DomainRow) => void;
  sedoListings: Map<string, SedoListing>;
  onSedoEdit: (domain: DomainRow, listing: SedoListing) => void;
  onSedoCreate: (domain: DomainRow) => void;
  onSedoRefresh: (domain: DomainRow) => void;
  sedoRefreshingIds: Set<string>;
  spaceshipListings: Map<string, SpaceshipListing>;
  onSpaceshipEdit: (domain: DomainRow, listing: SpaceshipListing) => void;
  onSpaceshipCreate: (domain: DomainRow) => void;
  onSpaceshipRefresh: (domain: DomainRow) => void;
  spaceshipRefreshingIds: Set<string>;
  afternicListings: Map<string, AfternicListing>;
  onAfternicEdit: (domain: DomainRow, listing: AfternicListing) => void;
  onAfternicCreate: (domain: DomainRow) => void;
  onAfternicRefresh: (domain: DomainRow) => void;
  onAfternicLogSale: (domain: DomainRow, listing: AfternicListing) => void;
  afternicRefreshingIds: Set<string>;
  onSedoBatch: () => void;
  onSpaceshipBatch: () => void;
  onSedoBatchSync: () => void;
  onSpaceshipBatchSync: () => void;
  onAfternicBulkList: () => void;
  onAfternicBulkEdit: () => void;
  onAfternicBulkRemove: () => void;
  onAfternicBulkLease: (enable: boolean) => void;
  onAfternicBulkFtBuynow: () => void;
  onAfternicBulkPreset: (preset: "lander-bn-mo" | "lander-all" | "lander-bn-only") => void;
  onCopySelected: () => void;
  onBulkRenew: () => void;
  reservedExtensions: Map<string, string[]>;
}

export function DomainTable({
  domains,
  total,
  page,
  totalPages,
  selectedIds,
  onSelectionChange,
  onDelete,
  onEdit,
  sedoListings,
  onSedoEdit,
  onSedoCreate,
  onSedoRefresh,
  sedoRefreshingIds,
  spaceshipListings,
  onSpaceshipEdit,
  onSpaceshipCreate,
  onSpaceshipRefresh,
  spaceshipRefreshingIds,
  afternicListings,
  onAfternicEdit,
  onAfternicCreate,
  onAfternicRefresh,
  onAfternicLogSale,
  afternicRefreshingIds,
  onSedoBatch,
  onSpaceshipBatch,
  onSedoBatchSync,
  onSpaceshipBatchSync,
  onAfternicBulkList,
  onAfternicBulkEdit,
  onAfternicBulkRemove,
  onAfternicBulkLease,
  onAfternicBulkFtBuynow,
  onAfternicBulkPreset,
  onCopySelected,
  onBulkRenew,
  reservedExtensions,
}: DomainTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get("sort") ?? "created_at";
  const currentOrder = searchParams.get("order") ?? "desc";
  const currentPageSize = searchParams.get("pageSize") ?? "50";

  const [showAllColumns, setShowAllColumns] = useState(false);

  const toggleAll = () => {
    if (selectedIds.size === domains.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(domains.map((d) => d.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(next);
  };

  const updateSort = (column: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (currentSort === column) {
      params.set("order", currentOrder === "asc" ? "desc" : "asc");
    } else {
      params.set("sort", column);
      params.set("order", "asc");
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  };

  const updatePageSize = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("pageSize", value);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const sortLabel = (col: string) => {
    if (currentSort !== col) return null;
    return currentOrder === "asc" ? " ↑" : " ↓";
  };

  const formatPrice = (price: number | null): string => {
    if (price === null || price === undefined) return "—";
    return `$${price.toLocaleString()}`;
  };

  const allSelected = domains.length > 0 && selectedIds.size === domains.length;

  const selectedFtMissing = Array.from(selectedIds).filter(
    (id) => afternicListings.get(id)?.fast_transfer_status === "INACTIVE_BUYNOW_MISSING"
  ).length;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl bg-bg-surface shadow-card ring-1 ring-border/50">
        <div className="flex items-center gap-2 border-b border-border/40 px-5 py-3">
          <label className="flex cursor-pointer select-none items-center gap-2 text-xs text-text-muted">
            <Checkbox checked={showAllColumns} onCheckedChange={(c) => setShowAllColumns(!!c)} />
            Show all columns
          </label>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => updateSort("domain")}
                    className="flex items-center gap-1 hover:text-text-primary"
                  >
                    Domain{sortLabel("domain")}
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead>Registrar</TableHead>
                <TableHead>
                  <button
                    onClick={() => updateSort("expiration_date")}
                    className="flex items-center gap-1 hover:text-text-primary"
                  >
                    Expiration{sortLabel("expiration_date")}
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                {showAllColumns && (
                  <TableHead>
                    <button
                      onClick={() => updateSort("total_cost")}
                      className="flex items-center gap-1 hover:text-text-primary"
                    >
                      Total Cost{sortLabel("total_cost")}
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                )}
                <TableHead>BIN</TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateSort("sedo_price")}
                      className="flex items-center gap-0.5 hover:text-text-primary"
                    >
                      Sedo{sortLabel("sedo_price")}
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                    {selectedIds.size > 0 && (
                      <Tooltip content={`Sync ${selectedIds.size} domains with Sedo`}>
                        <button
                          onClick={onSedoBatchSync}
                          className="text-text-muted transition-colors hover:text-accent-primary"
                          aria-label={`Sync ${selectedIds.size} domains with Sedo`}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                      </Tooltip>
                    )}
                    {selectedIds.size > 0 && (
                      <Tooltip content={`Edit Sedo price for ${selectedIds.size} domains`}>
                        <button
                          onClick={onSedoBatch}
                          className="text-text-muted transition-colors hover:text-accent-primary"
                          aria-label={`Edit Sedo price for ${selectedIds.size} domains`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </Tooltip>
                    )}
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateSort("spaceship_price")}
                      className="flex items-center gap-0.5 hover:text-text-primary"
                    >
                      Spaceship{sortLabel("spaceship_price")}
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                    {selectedIds.size > 0 && (
                      <Tooltip content={`Sync ${selectedIds.size} domains with Spaceship`}>
                        <button
                          onClick={onSpaceshipBatchSync}
                          className="text-text-muted transition-colors hover:text-accent-primary"
                          aria-label={`Sync ${selectedIds.size} domains with Spaceship`}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                      </Tooltip>
                    )}
                    {selectedIds.size > 0 && (
                      <Tooltip content={`Edit Spaceship price for ${selectedIds.size} domains`}>
                        <button
                          onClick={onSpaceshipBatch}
                          className="text-text-muted transition-colors hover:text-accent-primary"
                          aria-label={`Edit Spaceship price for ${selectedIds.size} domains`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </Tooltip>
                    )}
                  </div>
                </TableHead>
                <TableHead>Afternic</TableHead>
                {showAllColumns && (
                  <TableHead>
                    <button
                      onClick={() => updateSort("status")}
                      className="flex items-center gap-1 hover:text-text-primary"
                    >
                      Status{sortLabel("status")}
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                )}
                <TableHead className="w-[100px] font-mono text-xs">TLDs</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {domains.map((domain) => (
                <TableRow key={domain.id} className="hover:bg-bg-elevated">
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(domain.id)}
                      onCheckedChange={() => toggleOne(domain.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <RenewalToggle
                        domainId={domain.id}
                        toBeRenewal={
                          ((domain as Record<string, unknown>).to_be_renewal as boolean | null) ??
                          null
                        }
                      />
                      <button
                        onClick={() => router.push(`/domains/${domain.id}`)}
                        className="font-medium font-mono text-accent-primary hover:underline text-left"
                      >
                        {domain.domain}
                      </button>
                      <DomainRenewalBadge
                        count={domain.renewal_count}
                        totalCost={domain.renewal_cost}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{domain.registrar || "\u2014"}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {new Date(domain.expiration_date).toLocaleDateString()}
                      </span>
                      <DomainExpiryBadge expirationDate={domain.expiration_date} />
                    </div>
                  </TableCell>
                  {showAllColumns && (
                    <TableCell className="text-sm">
                      {formatPrice(
                        domain.total_cost ??
                          (domain.purchase_price ?? 0) + (domain.renewal_cost ?? 0)
                      )}
                    </TableCell>
                  )}
                  <TableCell className="text-sm">
                    {formatPrice((domain as Record<string, unknown>).bin as number | null)}
                  </TableCell>
                  <TableCell>
                    <SedoCell
                      listing={sedoListings.get(domain.id)}
                      onEdit={(listing) => onSedoEdit(domain, listing)}
                      onCreate={() => onSedoCreate(domain)}
                      onRefresh={() => onSedoRefresh(domain)}
                      refreshing={sedoRefreshingIds.has(domain.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <SpaceshipCell
                      listing={spaceshipListings.get(domain.id)}
                      onEdit={(listing) => onSpaceshipEdit(domain, listing)}
                      onCreate={() => onSpaceshipCreate(domain)}
                      onRefresh={() => onSpaceshipRefresh(domain)}
                      refreshing={spaceshipRefreshingIds.has(domain.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <AfternicCell
                      listing={afternicListings.get(domain.id)}
                      onEdit={(listing) => onAfternicEdit(domain, listing)}
                      onCreate={() => onAfternicCreate(domain)}
                      onRefresh={() => onAfternicRefresh(domain)}
                      onLogSale={(listing) => onAfternicLogSale(domain, listing)}
                      refreshing={afternicRefreshingIds.has(domain.id)}
                    />
                  </TableCell>
                  {showAllColumns && (
                    <TableCell>
                      <DomainStatusBadge status={domain.status} />
                    </TableCell>
                  )}
                  <TableCell>
                    <TldCell
                      domainId={domain.id}
                      domainName={domain.domain}
                      reservedTldsCount={
                        ((domain as Record<string, unknown>).reserved_tlds_count as
                          | number
                          | null) ?? null
                      }
                      reservedExtensions={reservedExtensions.get(domain.id) ?? []}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => router.push(`/domains/${domain.id}`)}
                        className="text-xs text-accent-primary hover:underline"
                      >
                        View
                      </button>
                      <button
                        onClick={() => onEdit(domain)}
                        className="text-xs text-accent-primary hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(domain.id)}
                        className="text-xs text-accent-danger hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/40 px-5 py-3 text-sm text-text-muted">
          <span className="tabular-nums">
            {total} domains · Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">Rows per page</span>
              <Select value={currentPageSize} onValueChange={updatePageSize}>
                <SelectTrigger className="h-8 w-[72px] rounded-lg text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="rounded-lg px-3 py-1.5 font-medium text-text-primary transition-colors hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Prev
              </button>
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                className="rounded-lg px-3 py-1.5 font-medium text-text-primary transition-colors hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap justify-end gap-2">
          <button
            onClick={onBulkRenew}
            className="px-4 py-2 rounded-md bg-accent-primary/10 border border-accent-primary/20 text-sm font-medium text-accent-primary hover:bg-accent-primary/20 transition-colors"
          >
            Renew {selectedIds.size} selected
          </button>
          <button
            onClick={onAfternicBulkList}
            className="px-4 py-2 rounded-md bg-bg-elevated border border-border text-sm font-medium hover:bg-bg-elevated/80 transition-colors"
          >
            List {selectedIds.size} on Afternic
          </button>
          <button
            onClick={onAfternicBulkEdit}
            className="px-4 py-2 rounded-md bg-bg-elevated border border-border text-sm font-medium hover:bg-bg-elevated/80 transition-colors"
          >
            Edit on Afternic
          </button>
          <button
            onClick={() => onAfternicBulkLease(true)}
            className="px-4 py-2 rounded-md bg-bg-elevated border border-border text-sm font-medium hover:bg-bg-elevated/80 transition-colors"
          >
            Enable Lease to Own
          </button>
          <button
            onClick={() => onAfternicBulkLease(false)}
            className="px-4 py-2 rounded-md bg-bg-elevated border border-border text-sm font-medium hover:bg-bg-elevated/80 transition-colors"
          >
            Disable Lease to Own
          </button>
          <button
            onClick={() => onAfternicBulkPreset("lander-bn-mo")}
            className="px-4 py-2 rounded-md bg-bg-elevated border border-border text-sm font-medium hover:bg-bg-elevated/80 transition-colors"
          >
            Buy Now + Make Offer
          </button>
          <button
            onClick={() => onAfternicBulkPreset("lander-all")}
            className="px-4 py-2 rounded-md bg-bg-elevated border border-border text-sm font-medium hover:bg-bg-elevated/80 transition-colors"
          >
            All three methods
          </button>
          <button
            onClick={() => onAfternicBulkPreset("lander-bn-only")}
            className="px-4 py-2 rounded-md bg-bg-elevated border border-border text-sm font-medium hover:bg-bg-elevated/80 transition-colors"
          >
            Buy Now only
          </button>
          {selectedFtMissing > 0 && (
            <button
              onClick={onAfternicBulkFtBuynow}
              className="px-4 py-2 rounded-md bg-accent-warning/10 border border-accent-warning/20 text-sm font-medium text-accent-warning hover:bg-accent-warning/20 transition-colors"
            >
              Set missing Buy Now ({selectedFtMissing})
            </button>
          )}
          <button
            onClick={onAfternicBulkRemove}
            className="px-4 py-2 rounded-md bg-accent-danger/10 border border-accent-danger/20 text-sm font-medium text-accent-danger hover:bg-accent-danger/20 transition-colors"
          >
            Remove from Afternic
          </button>
          <button
            onClick={onCopySelected}
            className="px-4 py-2 rounded-md bg-bg-elevated border border-border text-sm font-medium hover:bg-bg-elevated/80 transition-colors"
          >
            Copy {selectedIds.size} selected
          </button>
          {selectedIds.size > 1 && (
            <button
              onClick={() => onDelete("__bulk__")}
              className="px-4 py-2 rounded-md bg-accent-danger text-white text-sm font-medium hover:bg-accent-danger/90 transition-colors"
            >
              Delete {selectedIds.size} selected
            </button>
          )}
        </div>
      )}
    </div>
  );
}
