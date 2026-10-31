"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queryKeys } from "@/lib/query-keys";
import { upsertAtomListing } from "@/lib/supabase/queries/atom-listings-client";
import type { AtomCachePayload } from "@/lib/atom/mappers";
import type { AtomListing, AtomListingType } from "@/types/atom";

export interface BulkAtomListCandidate {
  id: string;
  domain: string;
  bin: number | null;
  alreadyListed: boolean;
  listing: AtomListing | null;
  afternicPrice: number | null;
  sedoPrice: number | null;
  spaceshipPrice: number | null;
}

interface BulkAtomListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidates: BulkAtomListCandidate[];
  onComplete: () => void;
}

type PriceRule = "manual" | "bin" | "bin20" | "bin30" | "afternic" | "sedo" | "spaceship";

const TYPE_OPTIONS = [
  { value: "standard", label: "Standard" },
  { value: "geo", label: "Geo" },
  { value: "premium", label: "Premium" },
];

const round = (n: number) => Math.round(n);

function computePrice(
  rule: PriceRule,
  fixed: number,
  candidate: BulkAtomListCandidate
): number | null {
  switch (rule) {
    case "manual":
      return fixed > 0 ? round(fixed) : null;
    case "afternic":
      return candidate.afternicPrice && candidate.afternicPrice > 0
        ? round(candidate.afternicPrice)
        : null;
    case "sedo":
      return candidate.sedoPrice && candidate.sedoPrice > 0 ? round(candidate.sedoPrice) : null;
    case "spaceship":
      return candidate.spaceshipPrice && candidate.spaceshipPrice > 0
        ? round(candidate.spaceshipPrice)
        : null;
    default: {
      const base = candidate.bin;
      if (!base) return null;
      if (rule === "bin") return round(base);
      if (rule === "bin20") return round(base * 0.8);
      return round(base * 0.7);
    }
  }
}

interface PreviewRow {
  candidate: BulkAtomListCandidate;
  price: number | null;
  skipReason: string | null;
}

interface ResultRow {
  domain: string;
  ok: boolean;
  message?: string;
}

export function BulkAtomListDialog({
  open,
  onOpenChange,
  candidates,
  onComplete,
}: BulkAtomListDialogProps) {
  const queryClient = useQueryClient();
  const [priceRule, setPriceRule] = useState<PriceRule>("afternic");
  const [fixedPrice, setFixedPrice] = useState("");
  const [listingType, setListingType] = useState<AtomListingType>("standard");
  const [confirmPremium, setConfirmPremium] = useState(false);
  const [overwrite, setOverwrite] = useState(false);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<ResultRow[] | null>(null);

  const preview = useMemo<PreviewRow[]>(
    () =>
      candidates.map((candidate) => {
        const price = computePrice(priceRule, Number(fixedPrice) || 0, candidate);
        let skipReason: string | null = null;
        if (candidate.alreadyListed && !overwrite) skipReason = "Already listed";
        else if (price === null) skipReason = "No price";

        return { candidate, price, skipReason };
      }),
    [candidates, priceRule, fixedPrice, overwrite]
  );

  const included = preview.filter((row) => !row.skipReason);
  const skipped = preview.filter((row) => row.skipReason);
  const newItems = included.filter((row) => !row.candidate.alreadyListed);
  const updateItems = included.filter((row) => row.candidate.alreadyListed);
  const premiumCount = listingType === "premium" ? newItems.length : 0;

  async function handleRun() {
    if (included.length === 0) return;
    if (listingType === "premium" && premiumCount > 0 && !confirmPremium) {
      toast.error("Confirm the coin spend to list as Premium");
      return;
    }

    setRunning(true);
    const rows: ResultRow[] = [];

    try {
      if (newItems.length > 0) {
        const response = await fetch("/api/atom/bulk-upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: newItems.map((row) => ({
              domain: row.candidate.domain,
              price: row.price,
              domainType: listingType,
            })),
            confirmPremium,
          }),
        });

        const body = await response.json().catch(() => ({}));
        if (!response.ok || body.error) {
          throw new Error(body.error ?? "Bulk list failed");
        }

        const succeeded = (body.data?.succeeded ?? []) as Array<{
          domain: string;
          payload: AtomCachePayload;
        }>;
        const failed = (body.data?.failed ?? []) as Array<{
          domain: string;
          message: string;
        }>;

        const idByDomain = new Map(
          newItems.map((row) => [row.candidate.domain.toLowerCase(), row.candidate.id])
        );

        for (const item of succeeded) {
          const domainId = idByDomain.get(item.domain.toLowerCase());
          if (domainId && item.payload) {
            await upsertAtomListing({ ...item.payload, domain_id: domainId });
          }
        }

        rows.push(
          ...succeeded.map((item) => ({ domain: item.domain, ok: true })),
          ...failed.map((item) => ({
            domain: item.domain,
            ok: false,
            message: item.message,
          }))
        );
      }

      if (updateItems.length > 0) {
        const response = await fetch("/api/atom/bulk-edit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: updateItems.map((row) => ({
              domain: row.candidate.domain,
              price: row.price,
            })),
          }),
        });

        const body = await response.json().catch(() => ({}));
        if (!response.ok || body.error) {
          throw new Error(body.error ?? "Bulk update failed");
        }

        const succeeded = (body.data?.succeeded ?? []) as Array<{
          domain: string;
          price: number;
        }>;
        const failed = (body.data?.failed ?? []) as Array<{
          domain: string;
          message: string;
        }>;

        const byDomain = new Map(
          updateItems.map((row) => [row.candidate.domain.toLowerCase(), row.candidate])
        );

        for (const item of succeeded) {
          const candidate = byDomain.get(item.domain.toLowerCase());
          if (!candidate?.listing) continue;
          await upsertAtomListing({
            domain_id: candidate.id,
            domain_name: candidate.listing.domain_name,
            atom_id: candidate.listing.atom_id,
            list_status: candidate.listing.list_status,
            listing_type: candidate.listing.listing_type,
            listing_type_raw: candidate.listing.listing_type_raw,
            selling_price: item.price,
            full_price: candidate.listing.full_price,
            discount: candidate.listing.discount,
            primary_category: candidate.listing.primary_category,
            logo_image: candidate.listing.logo_image,
            listed_at: candidate.listing.listed_at,
          });
        }

        rows.push(
          ...succeeded.map((item) => ({ domain: item.domain, ok: true })),
          ...failed.map((item) => ({
            domain: item.domain,
            ok: false,
            message: item.message,
          }))
        );
      }

      setResults(rows);
      queryClient.invalidateQueries({ queryKey: queryKeys.atomListings.all });
      const okCount = rows.filter((row) => row.ok).length;
      toast.success(`${okCount} domain${okCount === 1 ? "" : "s"} saved on Atom`);
      if (rows.every((row) => row.ok)) onComplete();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bulk list failed");
    } finally {
      setRunning(false);
    }
  }

  function handleClose(next: boolean) {
    if (!next && !running) {
      setResults(null);
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            List {candidates.length} domain{candidates.length === 1 ? "" : "s"} on Atom
          </DialogTitle>
          <DialogDescription>
            New domains are added. Domains already on Atom are skipped unless you choose to update
            them.
          </DialogDescription>
        </DialogHeader>

        {results ? (
          <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <tbody>
                {results.map((row) => (
                  <tr key={row.domain} className="border-t border-border/50 first:border-t-0">
                    <td className="px-3 py-1.5 font-mono text-xs">{row.domain}</td>
                    <td className="px-3 py-1.5 text-xs">
                      {row.ok ? (
                        <span className="text-accent-success">✓ Listed</span>
                      ) : (
                        <span className="text-accent-danger">✗ {row.message ?? "Failed"}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Price source</Label>
                <Select
                  value={priceRule}
                  onValueChange={(value) => setPriceRule(value as PriceRule)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[80]">
                    <SelectItem value="afternic">
                      Use each domain&apos;s Afternic Buy Now
                    </SelectItem>
                    <SelectItem value="sedo">Use each domain&apos;s Sedo price</SelectItem>
                    <SelectItem value="spaceship">
                      Use each domain&apos;s Spaceship price
                    </SelectItem>
                    <SelectItem value="bin">Use each domain&apos;s BIN</SelectItem>
                    <SelectItem value="bin20">BIN −20%</SelectItem>
                    <SelectItem value="bin30">BIN −30%</SelectItem>
                    <SelectItem value="manual">Manual price</SelectItem>
                  </SelectContent>
                </Select>
                {priceRule === "manual" && (
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    value={fixedPrice}
                    onChange={(e) => setFixedPrice(e.target.value)}
                    placeholder="0"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label>Listing type</Label>
                <Segmented
                  size="sm"
                  aria-label="Atom listing type"
                  options={TYPE_OPTIONS}
                  value={listingType}
                  onChange={(value) => {
                    setListingType(value as AtomListingType);
                    if (value !== "premium") setConfirmPremium(false);
                  }}
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={overwrite}
                onChange={(e) => setOverwrite(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              Also update domains already listed on Atom
            </label>

            {listingType === "premium" && premiumCount > 0 && (
              <div className="space-y-3 rounded-xl border border-accent-warning/40 bg-accent-warning/10 p-4">
                <div className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent-warning" />
                  <div>
                    <p className="font-medium text-accent-warning">
                      {premiumCount} coin{premiumCount === 1 ? "" : "s"} will be spent
                    </p>
                    <p className="text-xs text-text-muted">
                      Premium listings go to review and cannot be removed through the API.
                    </p>
                  </div>
                </div>
                <label className="flex cursor-pointer items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={confirmPremium}
                    onChange={(e) => setConfirmPremium(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border"
                  />
                  <span>
                    I understand {premiumCount} coin{premiumCount === 1 ? "" : "s"} will be spent.
                  </span>
                </label>
              </div>
            )}

            <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-bg-elevated/60 text-xs text-text-muted">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Domain</th>
                    <th className="px-3 py-2 text-right font-medium">Price</th>
                    <th className="px-3 py-2 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row) => (
                    <tr key={row.candidate.id} className="border-t border-border/50">
                      <td className="px-3 py-1.5 font-mono text-xs">{row.candidate.domain}</td>
                      <td className="px-3 py-1.5 text-right text-xs">
                        {row.price === null ? "—" : `$${row.price.toLocaleString("en-US")}`}
                      </td>
                      <td className="px-3 py-1.5 text-right text-xs">
                        {row.skipReason ? (
                          <span className="text-accent-warning">{row.skipReason}</span>
                        ) : row.candidate.alreadyListed ? (
                          <span className="text-accent-primary">Update price</span>
                        ) : (
                          <span className="text-accent-success">Add</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-text-muted">
              {newItems.length} new · {updateItems.length} price update
              {skipped.length > 0 ? ` · ${skipped.length} skipped` : ""}.
            </p>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={running}>
            {results ? "Close" : "Cancel"}
          </Button>
          {!results && (
            <Button onClick={handleRun} disabled={running || included.length === 0}>
              {running ? "Saving..." : `Save ${included.length} on Atom`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
