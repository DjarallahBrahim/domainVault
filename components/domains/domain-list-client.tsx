"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { queryKeys } from "@/lib/query-keys";
import { DomainTable } from "@/components/domains/domain-table";
import { DomainCard } from "@/components/domains/domain-card";
import { DomainSearch } from "@/components/domains/domain-search";
import { DomainEmptyState } from "@/components/domains/domain-empty-state";
import { DomainDeleteDialog } from "@/components/domains/domain-delete-dialog";
import { DomainAddDialog } from "@/components/domains/domain-add-dialog";
import { SedoOverlay } from "@/components/domains/SedoOverlay";
import { SedoSyncButton } from "@/components/domains/SedoSyncButton";
import { useSedoListings } from "@/lib/hooks/useSedoListings";
import { useSedoRefreshOne } from "@/lib/hooks/useSedoRefreshOne";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { deleteDomain, deleteDomains, fetchDomains } from "@/lib/supabase/queries/domains-client";
import { toast } from "sonner";
import type { Database } from "@/types/supabase";
import type { SedoListing } from "@/types/sedo";

type DomainRow = Database["public"]["Tables"]["domains"]["Row"];

interface DomainListClientProps {
  initialData: Awaited<
    ReturnType<typeof fetchDomains>
  >;
  tlds: string[];
  registrars: string[];
}

export function DomainListClient({ initialData, tlds, registrars }: DomainListClientProps) {
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
        pageSize: filters.pageSize ? Number(filters.pageSize) : undefined,
        expiry: filters.expiry,
        registrars: filters.registrar,
        notListed: filters.notListed,
      }),
    initialData,
    staleTime: 10 * 1000,
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showSlideover, setShowSlideover] = useState(false);
  const [editDomain, setEditDomain] = useState<DomainRow | null>(null);
  const [sedoOverlayDomain, setSedoOverlayDomain] = useState<DomainRow | null>(null);
  const [sedoExistingListing, setSedoExistingListing] = useState<SedoListing | null>(null);

  const { listings: sedoListings } = useSedoListings();
  const { refreshOne, isRefreshing } = useSedoRefreshOne();

  function handleSedoRefresh(domain: DomainRow) {
    refreshOne(domain.domain, domain.id);
  }

  function handleSedoEdit(domain: DomainRow, listing: SedoListing) {
    setSedoOverlayDomain(domain);
    setSedoExistingListing(listing);
  }

  function handleSedoCreate(domain: DomainRow) {
    setSedoOverlayDomain(domain);
    setSedoExistingListing(null);
  }

  function handleSedoClose() {
    setSedoOverlayDomain(null);
    setSedoExistingListing(null);
  }

  function handleAdd() {
    setEditDomain(null);
    setShowSlideover(true);
  }

  function handleEdit(domain: DomainRow) {
    setEditDomain(domain);
    setShowSlideover(true);
  }

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

  async function handleExport() {
    try {
      const params = new URLSearchParams(searchParams.toString());
      const filters = Object.fromEntries(params.entries());
      const { domains: allDomains } = await fetchDomains({
        status: filters.status,
        tld: filters.tld,
        search: filters.search,
        sort: filters.sort,
        order: filters.order,
        expiry: filters.expiry,
        registrars: filters.registrar,
        notListed: filters.notListed,
        page: 1,
        pageSize: 10000,
      });
      const csvHeader = ["Domain","TLD","Registrar","Expiration Date","Purchase Price","BIN","Status"];
      const csvRows = allDomains.map((d) => {
        const row = [d.domain, d.tld ?? "", d.registrar ?? "", d.expiration_date, d.purchase_price ?? "", (d as Record<string, unknown>).bin ?? "", d.status ?? ""];
        return row.map((v) => (String(v).includes(",") ? `"${v}"` : String(v))).join(",");
      });
      const csv = [csvHeader.join(","), ...csvRows].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "domains-export.csv";
      a.click();
      toast.success("CSV exported");
    } catch (err: unknown) {
      toast.error("Export failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

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
        <div className="flex justify-end">
          <Button variant="outline" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-1" />
            Add Domain
          </Button>
        </div>
        <DomainSearch tlds={tlds} registrars={registrars} />
        <DomainEmptyState onAddDomain={handleAdd} />
        <DomainAddDialog
        open={showSlideover}
        onOpenChange={setShowSlideover}
        domain={editDomain ?? undefined}
      />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-1" />
          Add Domain
        </Button>
        <SedoSyncButton />
      </div>
      <DomainSearch tlds={tlds} registrars={registrars} onExport={handleExport} />

      <div className="hidden sm:block">
        <DomainTable
          domains={data.domains}
          total={data.total}
          page={data.page}
          totalPages={data.totalPages}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onDelete={handleDelete}
          onEdit={handleEdit}
          sedoListings={sedoListings}
          onSedoEdit={handleSedoEdit}
          onSedoCreate={handleSedoCreate}
          onSedoRefresh={handleSedoRefresh}
          sedoRefreshingIds={new Set(data.domains.filter((d) => isRefreshing(d.id)).map((d) => d.id))}
        />
      </div>

      <div className="sm:hidden space-y-3">
        {data.domains.map((domain) => (
          <DomainCard
            key={domain.id}
            domain={domain}
            onDelete={handleDelete}
            sedoListings={sedoListings}
            onSedoEdit={handleSedoEdit}
            onSedoCreate={handleSedoCreate}
            onSedoRefresh={handleSedoRefresh}
            sedoRefreshingIds={new Set(data.domains.filter((d) => isRefreshing(d.id)).map((d) => d.id))}
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

      <DomainAddDialog
        open={showSlideover}
        onOpenChange={setShowSlideover}
        domain={editDomain ?? undefined}
      />

      <SedoOverlay
        open={sedoOverlayDomain !== null}
        onClose={handleSedoClose}
        domain={
          sedoOverlayDomain
            ? {
                id: sedoOverlayDomain.id,
                domain: sedoOverlayDomain.domain,
                registrar: sedoOverlayDomain.registrar,
                expiration_date: sedoOverlayDomain.expiration_date,
                bin: (sedoOverlayDomain as Record<string, unknown>).bin as number | null,
              }
            : null
        }
        existingListing={sedoExistingListing}
        onSuccess={() => {
          setSedoOverlayDomain(null);
          setSedoExistingListing(null);
        }}
      />
    </div>
  );
}
