"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queryKeys } from "@/lib/query-keys";
import { upsertAtomListing } from "@/lib/supabase/queries/atom-listings-client";
import type { AtomListing } from "@/types/atom";

export interface BulkAtomEditCandidate {
  id: string;
  domain: string;
  bin: number | null;
  afternicPrice: number | null;
  sedoPrice: number | null;
  spaceshipPrice: number | null;
  listing: AtomListing;
}

interface BulkAtomEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidates: BulkAtomEditCandidate[];
  onComplete: () => void;
}

type PriceRule = "manual" | "bin" | "bin20" | "bin30" | "afternic" | "sedo" | "spaceship";

const round = (n: number) => Math.round(n);

function computePrice(
  rule: PriceRule,
  fixed: number,
  candidate: BulkAtomEditCandidate
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
  id: string;
  domain: string;
  current: number | null;
  next: number | null;
  skipReason: string | null;
}

interface ResultRow {
  domain: string;
  ok: boolean;
  message?: string;
}

export function BulkAtomEditDialog({
  open,
  onOpenChange,
  candidates,
  onComplete,
}: BulkAtomEditDialogProps) {
  const queryClient = useQueryClient();
  const [priceRule, setPriceRule] = useState<PriceRule>("afternic");
  const [fixedPrice, setFixedPrice] = useState("");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<ResultRow[] | null>(null);

  const preview = useMemo<PreviewRow[]>(
    () =>
      candidates.map((candidate) => {
        const next = computePrice(priceRule, Number(fixedPrice) || 0, candidate);
        return {
          id: candidate.id,
          domain: candidate.domain,
          current: candidate.listing.selling_price,
          next,
          skipReason: next === null ? "No price" : null,
        };
      }),
    [candidates, priceRule, fixedPrice]
  );

  const included = preview.filter((row) => !row.skipReason);
  const skipped = preview.filter((row) => row.skipReason);
  const sourceLabel =
    priceRule === "manual"
      ? "manual price"
      : priceRule === "afternic"
        ? "Afternic Buy Now"
        : priceRule === "sedo"
          ? "Sedo price"
          : priceRule === "spaceship"
            ? "Spaceship price"
            : priceRule.toUpperCase();

  async function handleSave() {
    if (included.length === 0) return;
    setRunning(true);

    try {
      const response = await fetch("/api/atom/bulk-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: included.map((row) => ({ domain: row.domain, price: row.next })),
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

      const candidateByDomain = new Map(
        candidates.map((candidate) => [candidate.domain.toLowerCase(), candidate])
      );

      for (const item of succeeded) {
        const candidate = candidateByDomain.get(item.domain.toLowerCase());
        if (!candidate) continue;

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

      setResults([
        ...succeeded.map((item) => ({ domain: item.domain, ok: true })),
        ...failed.map((item) => ({
          domain: item.domain,
          ok: false,
          message: item.message,
        })),
      ]);

      queryClient.invalidateQueries({ queryKey: queryKeys.atomListings.all });
      toast.success(`${succeeded.length} Atom price${succeeded.length === 1 ? "" : "s"} updated`);
      if (failed.length === 0) onComplete();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bulk update failed");
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
            Edit Atom prices — {candidates.length} domain
            {candidates.length === 1 ? "" : "s"}
          </DialogTitle>
          <DialogDescription>
            Each domain is priced independently. Domains without the chosen source are skipped.
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
                        <span className="text-accent-success">✓ Updated</span>
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
            <div className="space-y-2">
              <Label>Price source</Label>
              <Select value={priceRule} onValueChange={(value) => setPriceRule(value as PriceRule)}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[80]">
                  <SelectItem value="afternic">Use each domain&apos;s Afternic Buy Now</SelectItem>
                  <SelectItem value="sedo">Use each domain&apos;s Sedo price</SelectItem>
                  <SelectItem value="spaceship">Use each domain&apos;s Spaceship price</SelectItem>
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

            <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-bg-elevated/60 text-xs text-text-muted">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Domain</th>
                    <th className="px-3 py-2 text-right font-medium">Current</th>
                    <th className="px-3 py-2 text-right font-medium">New</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row) => (
                    <tr key={row.id} className="border-t border-border/50">
                      <td className="px-3 py-1.5 font-mono text-xs">{row.domain}</td>
                      <td className="px-3 py-1.5 text-right text-xs text-text-muted">
                        {row.current === null
                          ? "—"
                          : `$${Math.round(row.current).toLocaleString("en-US")}`}
                      </td>
                      <td className="px-3 py-1.5 text-right text-xs">
                        {row.skipReason ? (
                          <span className="text-accent-warning">{row.skipReason}</span>
                        ) : (
                          `$${Number(row.next).toLocaleString("en-US")}`
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-text-muted">
              {included.length} will be updated
              {skipped.length > 0 ? ` · ${skipped.length} skipped (no ${sourceLabel})` : ""}.
            </p>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={running}>
            {results ? "Close" : "Cancel"}
          </Button>
          {!results && (
            <Button onClick={handleSave} disabled={running || included.length === 0}>
              {running ? "Updating..." : `Update ${included.length} on Atom`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
