"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { queryKeys } from "@/lib/query-keys";
import { DomainTable } from "@/components/domains/domain-table";
import { DomainCard } from "@/components/domains/domain-card";
import { DomainSearch } from "@/components/domains/domain-search";
import { DomainEmptyState } from "@/components/domains/domain-empty-state";
import { DomainDeleteDialog } from "@/components/domains/domain-delete-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { deleteDomain, deleteDomains, fetchDomains } from "@/lib/supabase/queries/domains-client";
import { toast } from "sonner";

interface DomainListClientProps {
  initialData: Awaited<
    ReturnType<typeof fetchDomains>
  >;
  tlds: string[];
}

export function DomainListClient({ initialData, tlds }: DomainListClientProps) {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const filters = Object.fromEntries(searchParams.entries());

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.domains.list(filters),
    queryFn: () =>
      fetchDomains({
        status: filters.status,
        tld: filters.tld,
        search: filters.search,
        sort: filters.sort,
        order: filters.order,
        page: filters.page ? Number(filters.page) : 1,
      }),
    initialData,
    staleTime: 10 * 1000,
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    if (id === "__bulk__") {
      setDeleteTarget("__bulk__");
    } else {
      setDeleteTarget(id);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget === "__bulk__") {
        const ids = Array.from(selectedIds);
        await deleteDomains(ids);
        setSelectedIds(new Set());
        queryClient.invalidateQueries({ queryKey: queryKeys.domains.all });
        toast.success("Domains deleted", {
          description: `${ids.length} domains removed.`,
        });
      } else {
        await deleteDomain(deleteTarget);
        queryClient.invalidateQueries({ queryKey: queryKeys.domains.all });
        toast.success("Domain deleted");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to delete";
      toast.error("Delete failed", { description: message });
    } finally {
      setDeleteTarget(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data.domains.length) {
    return (
      <div className="space-y-6">
        <DomainSearch tlds={tlds} />
        <DomainEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DomainSearch tlds={tlds} />

      {/* Desktop: Table (≥480px) */}
      <div className="hidden sm:block">
        <DomainTable
          domains={data.domains}
          total={data.total}
          page={data.page}
          totalPages={data.totalPages}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onDelete={handleDelete}
        />
      </div>

      {/* Mobile: Cards (<480px) */}
      <div className="sm:hidden space-y-3">
        {data.domains.map((domain) => (
          <DomainCard
            key={domain.id}
            domain={domain}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <DomainDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        count={
          deleteTarget === "__bulk__" ? selectedIds.size : 1
        }
        onConfirm={confirmDelete}
      />
    </div>
  );
}
