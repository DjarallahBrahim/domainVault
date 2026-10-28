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
import { RenewDomainsDialog } from "@/components/domains/renew-domains-dialog";
import { SedoOverlay } from "@/components/domains/SedoOverlay";
import { SpaceshipOverlay } from "@/components/domains/SpaceshipOverlay";
import { AfternicOverlay } from "@/components/domains/AfternicOverlay";
import { BulkAfternicListDialog } from "@/components/domains/BulkAfternicListDialog";
import { BulkAfternicEditDialog } from "@/components/domains/BulkAfternicEditDialog";
import { BulkAfternicRemoveDialog } from "@/components/domains/BulkAfternicRemoveDialog";
import { ImportUnmatchedAfternicDialog } from "@/components/domains/ImportUnmatchedAfternicDialog";
import { SyncMenu } from "@/components/domains/SyncMenu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SalesLogForm } from "@/components/sales/sales-log-form";
import { useSedoListings } from "@/lib/hooks/useSedoListings";
import { useSedoRefreshOne } from "@/lib/hooks/useSedoRefreshOne";
import { useSpaceshipListings } from "@/lib/hooks/useSpaceshipListings";
import { useSpaceshipRefreshOne } from "@/lib/hooks/useSpaceshipRefreshOne";
import { useAfternicListings } from "@/lib/hooks/useAfternicListings";
import { useAfternicRefreshOne } from "@/lib/hooks/useAfternicRefreshOne";
import type {
  AfternicSoldDomain,
  AfternicSyncResult,
  AfternicUnmatchedDomain,
} from "@/lib/hooks/useAfternicSync";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { deleteDomain, deleteDomains, fetchDomains } from "@/lib/supabase/queries/domains-client";
import { toast } from "sonner";
import type { Database } from "@/types/supabase";
import type { RenewalTarget } from "@/types/renewal";
import type { SedoListing } from "@/types/sedo";
import type { SpaceshipListing } from "@/types/spaceship";
import type { AfternicListing } from "@/types/afternic";

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
        status: filters.status ?? "all",
        tld: filters.tld,
        search: filters.search,
        sort: filters.sort,
        order: filters.order,
        page: filters.page ? Number(filters.page) : 1,
        pageSize: filters.pageSize ? Number(filters.pageSize) : undefined,
        expiry: filters.expiry,
        expiryMin: filters.expiryMin,
        expiryMax: filters.expiryMax,
        created: filters.created,
        renewal: filters.renewal,
        registrars: filters.registrar,
        notListed: filters.notListed,
        lander: filters.lander,
        shows: filters.shows,
        renewed: filters.renewed,
        reservedTld: filters.reservedTld,
      }),
    initialData,
    staleTime: 10 * 1000,
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [renewTargets, setRenewTargets] = useState<RenewalTarget[]>([]);
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

  const [afternicOverlayDomain, setAfternicOverlayDomain] = useState<DomainRow | null>(null);
  const [afternicExistingListing, setAfternicExistingListing] = useState<AfternicListing | null>(
    null
  );

  const { listings: afternicListings } = useAfternicListings();
  const { refreshOne: refreshAfternicOne, isRefreshing: isAfternicRefreshing } =
    useAfternicRefreshOne();

  const [afternicUnmatched, setAfternicUnmatched] = useState<AfternicUnmatchedDomain[]>([]);
  const [afternicSold, setAfternicSold] = useState<AfternicSoldDomain[]>([]);
  const [showUnmatched, setShowUnmatched] = useState(false);
  const [soldTarget, setSoldTarget] = useState<AfternicSoldDomain | null>(null);

  const [bulkListOpen, setBulkListOpen] = useState(false);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkEditMode, setBulkEditMode] = useState<
    | "edit"
    | "lease-enable"
    | "lease-disable"
    | "ft-buynow"
    | "lander-bn-mo"
    | "lander-all"
    | "lander-bn-only"
  >("edit");
  const [bulkRemoveOpen, setBulkRemoveOpen] = useState(false);

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

  function handleAfternicRefresh(domain: DomainRow) {
    refreshAfternicOne(domain.domain, domain.id);
  }

  function handleAfternicBatchSync() {
    const rows = selectedDomainRows();
    if (rows.length === 0) return;

    for (const domain of rows) {
      refreshAfternicOne(domain.domain, domain.id, { silent: true });
    }

    toast.success(`Syncing ${rows.length} Afternic listing${rows.length === 1 ? "" : "s"}`);
    setSelectedIds(new Set());
  }

  function handleAfternicEdit(domain: DomainRow, listing: AfternicListing) {
    setAfternicOverlayDomain(domain);
    setAfternicExistingListing(listing);
  }

  function handleAfternicCreate(domain: DomainRow) {
    setAfternicOverlayDomain(domain);
    setAfternicExistingListing(null);
  }

  function handleAfternicClose() {
    setAfternicOverlayDomain(null);
    setAfternicExistingListing(null);
  }

  function handleAfternicLogSale(domain: DomainRow, listing: AfternicListing) {
    setSoldTarget({
      domainId: domain.id,
      domain: domain.domain,
      buynowPrice: listing.buynow_price,
    });
  }

  function handleAfternicSynced(result: AfternicSyncResult) {
    setAfternicUnmatched(result.unmatched);
    setAfternicSold(result.sold);
  }

  function binOf(domain: DomainRow): number | null {
    return ((domain as Record<string, unknown>).bin as number | null) ?? null;
  }

  function selectedDomainRows(): DomainRow[] {
    return data.domains.filter((d) => selectedIds.has(d.id));
  }

  function handleAfternicBulkEdit(
    mode:
      | "edit"
      | "lease-enable"
      | "lease-disable"
      | "ft-buynow"
      | "lander-bn-mo"
      | "lander-all"
      | "lander-bn-only"
  ) {
    let rows = selectedDomainRows().filter((d) => afternicListings.has(d.id));

    if (mode === "ft-buynow") {
      rows = rows.filter(
        (d) => afternicListings.get(d.id)?.fast_transfer_status === "INACTIVE_BUYNOW_MISSING"
      );
    }

    if (rows.length === 0) {
      toast.error(
        mode === "ft-buynow"
          ? "No selected domains are missing a Buy Now price"
          : "Select domains that are listed on Afternic first"
      );
      return;
    }
    setBulkEditMode(mode);
    setBulkEditOpen(true);
  }

  function handleAfternicBulkRemove() {
    const rows = selectedDomainRows().filter((d) => afternicListings.has(d.id));
    if (rows.length === 0) {
      toast.error("Select domains that are listed on Afternic first");
      return;
    }
    setBulkRemoveOpen(true);
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

  function handleBulkRenew() {
    const targets = data.domains
      .filter((d) => selectedIds.has(d.id))
      .map((d) => ({
        id: d.id,
        domain: d.domain,
        expiration_date: d.expiration_date,
      }));

    if (targets.length > 0) setRenewTargets(targets);
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
        status: filters.status ?? "all",
        tld: filters.tld,
        search: filters.search,
        sort: filters.sort,
        order: filters.order,
        expiry: filters.expiry,
        expiryMin: filters.expiryMin,
        expiryMax: filters.expiryMax,
        created: filters.created,
        renewal: filters.renewal,
        registrars: filters.registrar,
        notListed: filters.notListed,
        lander: filters.lander,
        shows: filters.shows,
        renewed: filters.renewed,
        reservedTld: filters.reservedTld,
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
          <SyncMenu
            totalDomains={data.total}
            currentPageDomainIds={data.domains.map((d) => d.id)}
            domains={data.domains.map((d) => ({ id: d.id, domain: d.domain }))}
            userId={userId}
            onAfternicSynced={handleAfternicSynced}
          />
        </div>
      </div>

      {afternicUnmatched.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent-warning/30 bg-accent-warning/5 px-4 py-3">
          <p className="text-sm text-accent-warning">
            {afternicUnmatched.length} Afternic domain
            {afternicUnmatched.length === 1 ? " is" : "s are"} not in DomainVault.
          </p>
          <Button size="sm" variant="outline" onClick={() => setShowUnmatched(true)}>
            Review
          </Button>
        </div>
      )}

      {afternicSold.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent-success/30 bg-accent-success/5 px-4 py-3">
          <p className="text-sm text-accent-success">
            {afternicSold.length} domain{afternicSold.length === 1 ? "" : "s"} sold on Afternic —
            log the sale
            {afternicSold.length === 1 ? "" : "s"}.
          </p>
          <div className="flex flex-wrap gap-2">
            {afternicSold.slice(0, 3).map((item) => (
              <Button
                key={item.domainId}
                size="sm"
                variant="outline"
                onClick={() => setSoldTarget(item)}
              >
                Log {item.domain}
              </Button>
            ))}
          </div>
        </div>
      )}

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
          afternicListings={afternicListings}
          onAfternicEdit={handleAfternicEdit}
          onAfternicCreate={handleAfternicCreate}
          onAfternicRefresh={handleAfternicRefresh}
          onAfternicLogSale={handleAfternicLogSale}
          afternicRefreshingIds={
            new Set(data.domains.filter((d) => isAfternicRefreshing(d.id)).map((d) => d.id))
          }
          onSedoBatch={handleSedoBatch}
          onSpaceshipBatch={handleSpaceshipBatch}
          onSedoBatchSync={handleSedoBatchSync}
          onSpaceshipBatchSync={handleSpaceshipBatchSync}
          onAfternicBatchSync={handleAfternicBatchSync}
          onAfternicBulkList={() => setBulkListOpen(true)}
          onAfternicBulkEdit={() => handleAfternicBulkEdit("edit")}
          onAfternicBulkRemove={handleAfternicBulkRemove}
          onAfternicBulkLease={(enable) =>
            handleAfternicBulkEdit(enable ? "lease-enable" : "lease-disable")
          }
          onAfternicBulkFtBuynow={() => handleAfternicBulkEdit("ft-buynow")}
          onAfternicBulkPreset={(preset) => handleAfternicBulkEdit(preset)}
          onCopySelected={handleCopySelected}
          onBulkRenew={handleBulkRenew}
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
            afternicListings={afternicListings}
            onAfternicEdit={handleAfternicEdit}
            onAfternicCreate={handleAfternicCreate}
            onAfternicRefresh={handleAfternicRefresh}
            onAfternicLogSale={handleAfternicLogSale}
            afternicRefreshingIds={
              new Set(data.domains.filter((d) => isAfternicRefreshing(d.id)).map((d) => d.id))
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

      <RenewDomainsDialog
        open={renewTargets.length > 0}
        onOpenChange={(open) => {
          if (!open) setRenewTargets([]);
        }}
        targets={renewTargets}
        onRenewed={() => setSelectedIds(new Set())}
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
        batchAfternicListings={afternicListings}
        batchSpaceshipListings={spaceshipListings}
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
        batchAfternicListings={afternicListings}
        batchSedoListings={sedoListings}
      />

      <AfternicOverlay
        open={afternicOverlayDomain !== null}
        onClose={handleAfternicClose}
        domain={
          afternicOverlayDomain
            ? {
                id: afternicOverlayDomain.id,
                domain: afternicOverlayDomain.domain,
                registrar: afternicOverlayDomain.registrar,
                expiration_date: afternicOverlayDomain.expiration_date,
                bin: binOf(afternicOverlayDomain),
              }
            : null
        }
        existingListing={afternicExistingListing}
        onSuccess={handleAfternicClose}
      />

      {bulkListOpen && (
        <BulkAfternicListDialog
          open={bulkListOpen}
          onOpenChange={setBulkListOpen}
          candidates={selectedDomainRows().map((d) => ({
            id: d.id,
            domain: d.domain,
            bin: binOf(d),
            alreadyListed: afternicListings.has(d.id),
          }))}
          onComplete={() => {
            setBulkListOpen(false);
            setSelectedIds(new Set());
          }}
        />
      )}

      {bulkEditOpen && (
        <BulkAfternicEditDialog
          open={bulkEditOpen}
          onOpenChange={setBulkEditOpen}
          mode={bulkEditMode}
          candidates={selectedDomainRows().flatMap((d) => {
            const listing = afternicListings.get(d.id);
            return listing
              ? [
                  {
                    id: d.id,
                    domain: d.domain,
                    bin: binOf(d),
                    sedoPrice: sedoListings.get(d.id)?.sedo_price ?? null,
                    spaceshipPrice: spaceshipListings.get(d.id)?.spaceship_price ?? null,
                    listing,
                  },
                ]
              : [];
          })}
          onComplete={() => {
            setBulkEditOpen(false);
            setSelectedIds(new Set());
          }}
          onRecheck={(items) => {
            for (const item of items) {
              refreshAfternicOne(item.domain, item.id, { silent: true });
            }
          }}
        />
      )}

      {bulkRemoveOpen && (
        <BulkAfternicRemoveDialog
          open={bulkRemoveOpen}
          onOpenChange={setBulkRemoveOpen}
          candidates={selectedDomainRows().flatMap((d) =>
            afternicListings.has(d.id) ? [{ id: d.id, domain: d.domain }] : []
          )}
          onComplete={() => {
            setBulkRemoveOpen(false);
            setSelectedIds(new Set());
          }}
        />
      )}

      <ImportUnmatchedAfternicDialog
        open={showUnmatched}
        onOpenChange={setShowUnmatched}
        domains={afternicUnmatched}
        onImported={() => setAfternicUnmatched([])}
      />

      <Dialog
        open={soldTarget !== null}
        onOpenChange={(open) => {
          if (!open) setSoldTarget(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Log Afternic sale</DialogTitle>
          </DialogHeader>
          {soldTarget && (
            <SalesLogForm
              prefilledDomain={soldTarget.domain}
              prefilledPlatform="Afternic"
              defaultSoldAt={new Date().toISOString().slice(0, 10)}
              onSuccess={() => {
                setAfternicSold((prev) =>
                  prev.filter((item) => item.domainId !== soldTarget.domainId)
                );
                setSoldTarget(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
