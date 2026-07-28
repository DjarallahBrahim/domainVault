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
import { DomainStatusBadge } from "@/components/domains/domain-status-badge";
import { DomainExpiryBadge } from "@/components/domains/domain-expiry-badge";
import { SedoCell } from "@/components/domains/SedoCell";
import { SpaceshipCell } from "@/components/domains/SpaceshipCell";
import type { Database } from "@/types/supabase";
import type { SedoListing } from "@/types/sedo";
import type { SpaceshipListing } from "@/types/spaceship";
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
  onSedoBatch: () => void;
  onSpaceshipBatch: () => void;
  onSedoBatchSync: () => void;
  onSpaceshipBatchSync: () => void;
  onCopySelected: () => void;
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
  onSedoBatch,
  onSpaceshipBatch,
  onSedoBatchSync,
  onSpaceshipBatchSync,
  onCopySelected,
}: DomainTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get("sort") ?? "created_at";
  const currentOrder = searchParams.get("order") ?? "desc";

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

  const sortLabel = (col: string) => {
    if (currentSort !== col) return null;
    return currentOrder === "asc" ? " ↑" : " ↓";
  };

  const formatPrice = (price: number | null): string => {
    if (price === null || price === undefined) return "—";
    return `$${price.toLocaleString()}`;
  };

  const allSelected = domains.length > 0 && selectedIds.size === domains.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-xs text-text-muted cursor-pointer select-none">
          <Checkbox
            checked={showAllColumns}
            onCheckedChange={(c) => setShowAllColumns(!!c)}
          />
          Show all columns
        </label>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                />
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
              {showAllColumns && (
                <TableHead>TLD</TableHead>
              )}
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
                <TableHead>Purchase</TableHead>
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
                    <button
                      onClick={onSedoBatchSync}
                      className="text-text-muted hover:text-accent-primary transition-colors"
                      title={`Sync ${selectedIds.size} domains with Sedo`}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {selectedIds.size > 0 && (
                    <button
                      onClick={onSedoBatch}
                      className="text-text-muted hover:text-accent-primary transition-colors"
                      title={`Edit Sedo price for ${selectedIds.size} domains`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
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
                    <button
                      onClick={onSpaceshipBatchSync}
                      className="text-text-muted hover:text-accent-primary transition-colors"
                      title={`Sync ${selectedIds.size} domains with Spaceship`}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {selectedIds.size > 0 && (
                    <button
                      onClick={onSpaceshipBatch}
                      className="text-text-muted hover:text-accent-primary transition-colors"
                      title={`Edit Spaceship price for ${selectedIds.size} domains`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </TableHead>
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
              <TableHead>
                <button
                  onClick={() => updateSort("created_at")}
                  className="flex items-center gap-1 hover:text-text-primary"
                >
                  Added{sortLabel("created_at")}
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
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
                  <button
                    onClick={() => router.push(`/domains/${domain.id}`)}
                    className="font-medium font-mono text-accent-primary hover:underline text-left"
                  >
                    {domain.domain}
                  </button>
                </TableCell>
                {showAllColumns && (
                  <TableCell>
                    <span className="text-xs text-text-muted">.{domain.tld}</span>
                  </TableCell>
                )}
                <TableCell>
                  <span className="text-sm">
                    {domain.registrar || "\u2014"}
                  </span>
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
                    {formatPrice(domain.purchase_price)}
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
                {showAllColumns && (
                  <TableCell>
                    <DomainStatusBadge status={domain.status} />
                  </TableCell>
                )}
                <TableCell className="text-sm text-text-muted">
                  {new Date(domain.created_at).toLocaleDateString()}
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
      <div className="flex items-center justify-between text-sm text-text-muted">
        <span>
          {total} domains · Page {page} of {totalPages}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1 rounded-md bg-bg-elevated hover:bg-bg-elevated/80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1 rounded-md bg-bg-elevated hover:bg-bg-elevated/80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex justify-end gap-2">
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
