"use client";

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
import type { Database } from "@/types/supabase";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ArrowUpDown } from "lucide-react";

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
}: DomainTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get("sort") ?? "expiration_date";
  const currentOrder = searchParams.get("order") ?? "asc";

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
              <TableHead>TLD</TableHead>
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
              <TableHead>Purchase</TableHead>
              <TableHead>BIN</TableHead>
              <TableHead>
                <button
                  onClick={() => updateSort("status")}
                  className="flex items-center gap-1 hover:text-text-primary"
                >
                  Status{sortLabel("status")}
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
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
              <TableRow key={domain.id}>
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
                <TableCell>
                  <span className="text-xs text-text-muted">.{domain.tld}</span>
                </TableCell>
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
                <TableCell className="text-sm">
                  {formatPrice(domain.purchase_price)}
                </TableCell>
                <TableCell className="text-sm">
                  {formatPrice((domain as Record<string, unknown>).bin as number | null)}
                </TableCell>
                <TableCell>
                  <DomainStatusBadge status={domain.status} />
                </TableCell>
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

      {/* Bulk delete */}
      {selectedIds.size > 1 && (
        <div className="flex justify-end">
          <button
            onClick={() => onDelete("__bulk__")}
            className="px-4 py-2 rounded-md bg-accent-danger text-white text-sm font-medium hover:bg-accent-danger/90 transition-colors"
          >
            Delete {selectedIds.size} selected
          </button>
        </div>
      )}
    </div>
  );
}
