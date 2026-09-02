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
import { SpaceshipOverlay } from "@/components/domains/SpaceshipOverlay";
import { SpaceshipSyncButton } from "@/components/domains/SpaceshipSyncButton";
import { TldSyncModal } from "@/components/domains/TldSyncModal";
import { useSedoListings } from "@/lib/hooks/useSedoListings";
import { useSedoRefreshOne } from "@/lib/hooks/useSedoRefreshOne";
import { useSpaceshipListings } from "@/lib/hooks/useSpaceshipListings";
import { useSpaceshipRefreshOne } from "@/lib/hooks/useSpaceshipRefreshOne";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { deleteDomain, deleteDomains, fetchDomains } from "@/lib/supabase/queries/domains-client";
import { toast } from "sonner";
import type { Database } from "@/types/supabase";
import type { SedoListing } from "@/types/sedo";
import type { SpaceshipListing } from "@/types/spaceship";

type DomainRow = Database["public"]["Tables"]["domains"]["Row"];

interface DomainListClientProps {
  initialData: Awaited<ReturnType<typeof fetchDomains>>;
  tlds: string[];
  registrars: string[];
  userId: string;
}

export function DomainListClient({ initialData, tlds, registrars, userId }: DomainListClientProps) {
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
        created: filters.created,
        renewal: filters.renewal,
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
  const [sedoBatchMode, setSedoBatchMode] = useState(false);

  const { listings: sedoListings } = useSedoListings();
  const { refreshOne, isRefreshing } = useSedoRefreshOne();

  const [spaceshipOverlayDomain, setSpaceshipOverlayDomain] = useState<DomainRow | null>(null);
  const [spaceshipExistingListing, setSpaceshipExistingListing] = useState<SpaceshipListing | null>(
    null
  );
  const [spaceshipBatchMode, setSpaceshipBatchMode] = useState(false);

  const { listings: spaceshipListings } = useSpaceshipListings();
  const { refreshOne: refreshSpaceshipOne, isRefreshing: isSpaceshipRefreshing } =
    useSpaceshipRefreshOne();

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
    setSedoBatchMode(false);
  }

  function handleSedoBatch() {
    setSedoBatchMode(true);
  }

  function handleSedoBatchSync() {
    for (const id of selectedIds) {
      const domain = data.domains.find((d) => d.id === id);
      if (domain) refreshOne(domain.domain, domain.id);
    }
    setSelectedIds(new Set());
  }

  function handleSpaceshipRefresh(domain: DomainRow) {
    refreshSpaceshipOne(domain.domain, domain.id);
  }

  function handleSpaceshipEdit(domain: DomainRow, listing: SpaceshipListing) {
    setSpaceshipOverlayDomain(domain);
    setSpaceshipExistingListing(listing);
  }

  function handleSpaceshipCreate(domain: DomainRow) {
    setSpaceshipOverlayDomain(domain);
    setSpaceshipExistingListing(null);
  }

  function handleSpaceshipClose() {
    setSpaceshipOverlayDomain(null);
    setSpaceshipExistingListing(null);
    setSpaceshipBatchMode(false);
  }

  function handleSpaceshipBatch() {
    setSpaceshipBatchMode(true);
  }

  function handleSpaceshipBatchSync() {
    for (const id of selectedIds) {
      const domain = data.domains.find((d) => d.id === id);
      if (domain) refreshSpaceshipOne(domain.domain, domain.id);
    }
    setSelectedIds(new Set());
  }

  function handleCopySelected() {
    const names = data.domains
      .filter((d) => selectedIds.has(d.id))
      .map((d) => d.domain)
      .join("\n");

    navigator.clipboard.writeText(names).then(
      () =>
        toast.success(
          `${selectedIds.size} domain${selectedIds.size !== 1 ? "s" : ""} copied to clipboard`
        ),
      () => toast.error("Failed to copy")
    );
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
      const message = err instanceof Error ? err.message : "Failed to delete";
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
        created: filters.created,
        renewal: filters.renewal,
        registrars: filters.registrar,
        notListed: filters.notListed,
        page: 1,
        pageSize: 10000,
      });
      const csvHeader = [
        "Domain",
        "TLD",
        "Registrar",
        "Expiration Date",
        "Purchase Price",
        "BIN",
        "Status",
      ];
      const csvRows = allDomains.map((d) => {
        const row = [
          d.domain,
          d.tld ?? "",
          d.registrar ?? "",
          d.expiration_date,
          d.purchase_price ?? "",
          (d as Record<string, unknown>).bin ?? "",
          d.status ?? "",
        ];
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
      <div className="flex justify-between items-center flex-wrap gap-2">
        <Button variant="outline" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-1" />
          Add Domain
        </Button>
        <div className="flex items-center gap-2">
          <TldSyncModal
            totalDomains={data.total}
            currentPageDomainIds={data.domains.map((d) => d.id)}
            domains={data.domains.map((d) => ({ id: d.id, domain: d.domain }))}
            userId={userId}
          />
          <SedoSyncButton />
          <SpaceshipSyncButton />
        </div>
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
          sedoRefreshingIds={
            new Set(data.domains.filter((d) => isRefreshing(d.id)).map((d) => d.id))
          }
          spaceshipListings={spaceshipListings}
          onSpaceshipEdit={handleSpaceshipEdit}
          onSpaceshipCreate={handleSpaceshipCreate}
          onSpaceshipRefresh={handleSpaceshipRefresh}
          spaceshipRefreshingIds={
            new Set(data.domains.filter((d) => isSpaceshipRefreshing(d.id)).map((d) => d.id))
          }
          onSedoBatch={handleSedoBatch}
          onSpaceshipBatch={handleSpaceshipBatch}
          onSedoBatchSync={handleSedoBatchSync}
          onSpaceshipBatchSync={handleSpaceshipBatchSync}
          onCopySelected={handleCopySelected}
          reservedExtensions={data.reservedExtensions}
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
            sedoRefreshingIds={
              new Set(data.domains.filter((d) => isRefreshing(d.id)).map((d) => d.id))
            }
            spaceshipListings={spaceshipListings}
            onSpaceshipEdit={handleSpaceshipEdit}
            onSpaceshipCreate={handleSpaceshipCreate}
            onSpaceshipRefresh={handleSpaceshipRefresh}
            spaceshipRefreshingIds={
              new Set(data.domains.filter((d) => isSpaceshipRefreshing(d.id)).map((d) => d.id))
            }
            reservedExtensions={data.reservedExtensions}
          />
        ))}
      </div>

      <DomainDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        count={deleteTarget === "__bulk__" ? selectedIds.size : 1}
        onConfirm={confirmDelete}
      />

      <DomainAddDialog
        open={showSlideover}
        onOpenChange={setShowSlideover}
        domain={editDomain ?? undefined}
      />

      <SedoOverlay
        open={sedoOverlayDomain !== null || sedoBatchMode}
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
          setSedoBatchMode(false);
          setSelectedIds(new Set());
        }}
        batch={sedoBatchMode}
        batchDomains={
          sedoBatchMode
            ? data.domains
                .filter((d) => selectedIds.has(d.id))
                .map((d) => ({ id: d.id, domain: d.domain }))
            : undefined
        }
      />

      <SpaceshipOverlay
        open={spaceshipOverlayDomain !== null || spaceshipBatchMode}
        onClose={handleSpaceshipClose}
        domain={
          spaceshipOverlayDomain
            ? {
                id: spaceshipOverlayDomain.id,
                domain: spaceshipOverlayDomain.domain,
                registrar: spaceshipOverlayDomain.registrar,
                expiration_date: spaceshipOverlayDomain.expiration_date,
                bin: (spaceshipOverlayDomain as Record<string, unknown>).bin as number | null,
              }
            : null
        }
        existingListing={spaceshipExistingListing}
        onSuccess={() => {
          setSpaceshipOverlayDomain(null);
          setSpaceshipExistingListing(null);
          setSpaceshipBatchMode(false);
          setSelectedIds(new Set());
        }}
        batch={spaceshipBatchMode}
        batchDomains={
          spaceshipBatchMode
            ? data.domains
                .filter((d) => selectedIds.has(d.id))
                .map((d) => ({ id: d.id, domain: d.domain }))
            : undefined
        }
      />
    </div>
  );
}
