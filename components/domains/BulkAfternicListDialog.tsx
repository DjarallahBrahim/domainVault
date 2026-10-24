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
import { upsertAfternicListing } from "@/lib/supabase/queries/afternic-listings-client";
import type { AfternicCachePayload } from "@/lib/afternic/mappers";
import { clampMinbid, MAX_BUYNOW_USD } from "@/lib/afternic/pricing";
import type { AfternicIntakeStyle } from "@/types/afternic";

export interface BulkListCandidate {
  id: string;
  domain: string;
  bin: number | null;
  alreadyListed: boolean;
}

interface BulkAfternicListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidates: BulkListCandidate[];
  onComplete: () => void;
}

type PriceRule = "bin" | "bin20" | "bin30" | "fixed";
type MinbidRule = "none" | "20" | "30" | "40" | "50";

interface PreviewRow {
  id: string;
  domain: string;
  buynow: number | null;
  minbid: number | null;
  skipReason: string | null;
}

interface ResultRow {
  domain: string;
  ok: boolean;
  message?: string;
}

function computeBuynow(rule: PriceRule, fixed: number, bin: number | null): number | null {
  if (rule === "fixed") return fixed > 0 ? Math.round(fixed) : null;
  if (!bin) return null;
  if (rule === "bin") return Math.round(bin);
  if (rule === "bin20") return Math.round(bin * 0.8);
  return Math.round(bin * 0.7);
}

export function BulkAfternicListDialog({
  open,
  onOpenChange,
  candidates,
  onComplete,
}: BulkAfternicListDialogProps) {
  const queryClient = useQueryClient();

  const [priceRule, setPriceRule] = useState<PriceRule>("bin");
  const [fixedPrice, setFixedPrice] = useState("");
  const [minbidRule, setMinbidRule] = useState<MinbidRule>("none");
  const [intakeStyle, setIntakeStyle] = useState<AfternicIntakeStyle>("BUYNOW");
  const [overwrite, setOverwrite] = useState(false);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const [failedItems, setFailedItems] = useState<BulkListCandidate[]>([]);

  const preview = useMemo<PreviewRow[]>(() => {
    return candidates.map((candidate) => {
      const buynow = computeBuynow(priceRule, Number(fixedPrice) || 0, candidate.bin);
      const minbid =
        buynow && minbidRule !== "none" ? clampMinbid(buynow * (Number(minbidRule) / 100)) : null;

      let skipReason: string | null = null;
      if (candidate.alreadyListed && !overwrite) {
        skipReason = "Already listed";
      } else if (!buynow) {
        skipReason = "No price";
      } else if (buynow > MAX_BUYNOW_USD) {
        skipReason = "Price too high";
      }

      return {
        id: candidate.id,
        domain: candidate.domain,
        buynow,
        minbid,
        skipReason,
      };
    });
  }, [candidates, priceRule, fixedPrice, minbidRule, overwrite]);

  const included = preview.filter((row) => !row.skipReason);
  const skipped = preview.filter((row) => row.skipReason);

  async function run(items: PreviewRow[]) {
    if (items.length === 0) return;
    setRunning(true);

    try {
      const response = await fetch("/api/afternic/bulk-upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((row) => ({
            domain: row.domain,
            buynow: row.buynow,
            minbid: row.minbid,
            intakeStyle,
            landingPage: "SALES_TYPE",
          })),
        }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok || body.error) {
        throw new Error(body.error ?? "Bulk list failed");
      }

      const succeeded = (body.data?.succeeded ?? []) as Array<{
        domain: string;
        payload: AfternicCachePayload;
      }>;
      const failed = (body.data?.failed ?? []) as Array<{
        domain: string;
        message: string;
      }>;

      const idByDomain = new Map(
        candidates.map((candidate) => [candidate.domain.toLowerCase(), candidate.id])
      );

      for (const item of succeeded) {
        const domainId = idByDomain.get(item.domain.toLowerCase());
        if (domainId && item.payload) {
          await upsertAfternicListing({ ...item.payload, domain_id: domainId });
        }
      }

      const failedDomains = new Set(failed.map((f) => f.domain.toLowerCase()));

      setResults([
        ...succeeded.map((item) => ({ domain: item.domain, ok: true })),
        ...failed.map((item) => ({
          domain: item.domain,
          ok: false,
          message: item.message,
        })),
      ]);
      setFailedItems(
        items
          .filter((row) => failedDomains.has(row.domain.toLowerCase()))
          .map((row) => {
            const candidate = candidates.find((c) => c.id === row.id);
            return candidate as BulkListCandidate;
          })
          .filter(Boolean)
      );

      queryClient.invalidateQueries({ queryKey: queryKeys.afternicListings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.domains.all });

      toast.success(
        `${succeeded.length} domain${succeeded.length === 1 ? "" : "s"} submitted to Afternic`
      );
      if (failed.length === 0) onComplete();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bulk list failed");
    } finally {
      setRunning(false);
    }
  }

  function handleClose(next: boolean) {
    if (!next && !running) {
      setResults(null);
      setFailedItems([]);
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            List {included.length} domain{included.length === 1 ? "" : "s"} on Afternic
          </DialogTitle>
          <DialogDescription>
            Choose how prices are calculated. Domains without a price are skipped.
          </DialogDescription>
        </DialogHeader>

        {!results ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Buy Now price</Label>
                <Select
                  value={priceRule}
                  onValueChange={(value) => setPriceRule(value as PriceRule)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bin">Use each domain&apos;s BIN</SelectItem>
                    <SelectItem value="bin20">BIN −20%</SelectItem>
                    <SelectItem value="bin30">BIN −30%</SelectItem>
                    <SelectItem value="fixed">Fixed price</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {priceRule === "fixed" && (
                <div className="space-y-1">
                  <Label htmlFor="bulk-fixed-price">Fixed price ($)</Label>
                  <Input
                    id="bulk-fixed-price"
                    type="number"
                    step="1"
                    min="1"
                    value={fixedPrice}
                    onChange={(e) => setFixedPrice(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-1">
                <Label>Min offer</Label>
                <Select
                  value={minbidRule}
                  onValueChange={(value) => setMinbidRule(value as MinbidRule)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="20">20% of Buy Now</SelectItem>
                    <SelectItem value="30">30% of Buy Now</SelectItem>
                    <SelectItem value="40">40% of Buy Now</SelectItem>
                    <SelectItem value="50">50% of Buy Now</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Lander</Label>
                <Select
                  value={intakeStyle}
                  onValueChange={(value) => setIntakeStyle(value as AfternicIntakeStyle)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BUYNOW">Buy it Now</SelectItem>
                    <SelectItem value="PRICE_FORM">Request Price</SelectItem>
                    <SelectItem value="CUSTOM_LANDER">Custom lander</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-text-muted">
              <input
                type="checkbox"
                checked={overwrite}
                onChange={(e) => setOverwrite(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              Overwrite existing Afternic listings
            </label>

            <div className="overflow-hidden rounded-lg border border-border">
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-bg-elevated text-xs text-text-muted">
                    <tr>
                      <th className="px-3 py-2 text-left">Domain</th>
                      <th className="px-3 py-2 text-right">Buy Now</th>
                      <th className="px-3 py-2 text-right">Min offer</th>
                      <th className="px-3 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row) => (
                      <tr key={row.id} className="border-t border-border/50">
                        <td className="px-3 py-1.5 font-mono text-xs">{row.domain}</td>
                        <td className="px-3 py-1.5 text-right font-mono">
                          {row.buynow ? `$${row.buynow.toLocaleString("en-US")}` : "—"}
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono">
                          {row.minbid ? `$${row.minbid.toLocaleString("en-US")}` : "—"}
                        </td>
                        <td className="px-3 py-1.5 text-xs">
                          {row.skipReason ? (
                            <span className="text-accent-warning">{row.skipReason}</span>
                          ) : (
                            <span className="text-accent-success">Ready</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {skipped.length > 0 && (
              <p className="text-xs text-text-muted">
                {skipped.length} skipped · {included.length} will be submitted
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
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
            {failedItems.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                disabled={running}
                onClick={() =>
                  run(
                    failedItems.map((item) => ({
                      id: item.id,
                      domain: item.domain,
                      buynow: computeBuynow(priceRule, Number(fixedPrice) || 0, item.bin),
                      minbid:
                        minbidRule !== "none"
                          ? clampMinbid(
                              (computeBuynow(priceRule, Number(fixedPrice) || 0, item.bin) ?? 0) *
                                (Number(minbidRule) / 100)
                            )
                          : null,
                      skipReason: null,
                    }))
                  )
                }
              >
                Retry {failedItems.length} failed
              </Button>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={running}>
            {results ? "Close" : "Cancel"}
          </Button>
          {!results && (
            <Button onClick={() => run(included)} disabled={running || included.length === 0}>
              {running ? "Listing..." : `List ${included.length} domains`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
