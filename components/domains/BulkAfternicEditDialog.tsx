"use client";

import { useMemo, useRef, useState } from "react";
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
import { clampMinbid, MAX_BUYNOW_USD, MIN_BID_USD } from "@/lib/afternic/pricing";
import { landerBadge, listingLanderBadge, type LanderOptions } from "@/lib/afternic/lander";
import type { AfternicCachePayload } from "@/lib/afternic/mappers";
import type { AfternicIntakeStyle, AfternicListing, AfternicPatchChanges } from "@/types/afternic";

export type BulkEditMode =
  | "edit"
  | "lease-enable"
  | "lease-disable"
  | "ft-buynow"
  | "lander-bn-mo"
  | "lander-all"
  | "lander-bn-only";

type ThreeWay = "unchanged" | "enable" | "disable";

function applyMode(current: boolean, mode: ThreeWay): boolean {
  if (mode === "enable") return true;
  if (mode === "disable") return false;
  return current;
}

function ThreeWaySelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ThreeWay;
  onChange: (value: ThreeWay) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-medium">{label}</span>
      <Select value={value} onValueChange={(next) => onChange(next as ThreeWay)}>
        <SelectTrigger className="h-8 w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unchanged">Leave unchanged</SelectItem>
          <SelectItem value="enable">Enable</SelectItem>
          <SelectItem value="disable">Disable</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export interface BulkEditCandidate {
  id: string;
  domain: string;
  bin: number | null;
  sedoPrice: number | null;
  spaceshipPrice: number | null;
  listing: AfternicListing;
}

interface BulkAfternicEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidates: BulkEditCandidate[];
  mode: BulkEditMode;
  onComplete: () => void;
  onRecheck?: (items: Array<{ id: string; domain: string }>) => void;
}

type PriceRule = "bin" | "bin20" | "bin30" | "fixed" | "sedo" | "spaceship";
type MinbidRule = "20" | "30" | "40" | "50" | "custom";

function computeBuynow(
  rule: PriceRule,
  fixed: number,
  candidate: BulkEditCandidate
): number | null {
  if (rule === "fixed") return fixed > 0 ? Math.round(fixed) : null;
  if (rule === "sedo") {
    return candidate.sedoPrice && candidate.sedoPrice > 0 ? Math.round(candidate.sedoPrice) : null;
  }
  if (rule === "spaceship") {
    return candidate.spaceshipPrice && candidate.spaceshipPrice > 0
      ? Math.round(candidate.spaceshipPrice)
      : null;
  }
  const base = candidate.bin;
  if (!base) return null;
  if (rule === "bin") return Math.round(base);
  if (rule === "bin20") return Math.round(base * 0.8);
  return Math.round(base * 0.7);
}

interface PreviewRow {
  id: string;
  domain: string;
  current: string;
  next: string;
  skipReason: string | null;
  changes: AfternicPatchChanges;
}

export function BulkAfternicEditDialog({
  open,
  onOpenChange,
  candidates,
  mode,
  onComplete,
  onRecheck,
}: BulkAfternicEditDialogProps) {
  const queryClient = useQueryClient();

  const [changeBuynow, setChangeBuynow] = useState(mode === "ft-buynow");
  const [priceRule, setPriceRule] = useState<PriceRule>(mode === "ft-buynow" ? "bin" : "bin20");
  const [fixedPrice, setFixedPrice] = useState("");

  const [changeMinbid, setChangeMinbid] = useState(false);
  const [minbidRule, setMinbidRule] = useState<MinbidRule>("30");
  const [minbidCustom, setMinbidCustom] = useState("");

  const [changeLander, setChangeLander] = useState(false);
  const [intakeStyle, setIntakeStyle] = useState<AfternicIntakeStyle>("BUYNOW");

  const [changeVisibility, setChangeVisibility] = useState(false);
  const [hidden, setHidden] = useState(false);

  const isLanderPreset =
    mode === "lander-bn-mo" || mode === "lander-all" || mode === "lander-bn-only";
  const isLeasePreset = mode === "lease-enable" || mode === "lease-disable";

  const [changeLanderOptions, setChangeLanderOptions] = useState(isLanderPreset || isLeasePreset);
  const [buynowMode, setBuynowMode] = useState<ThreeWay>(
    mode === "lander-bn-mo" || mode === "lander-all" || mode === "lander-bn-only"
      ? "enable"
      : "unchanged"
  );
  const [makeOfferMode, setMakeOfferMode] = useState<ThreeWay>(
    mode === "lander-bn-mo" || mode === "lander-all"
      ? "enable"
      : mode === "lander-bn-only"
        ? "disable"
        : "unchanged"
  );
  const [leaseMode, setLeaseMode] = useState<ThreeWay>(
    mode === "lander-all" || mode === "lease-enable"
      ? "enable"
      : mode === "lease-disable" || mode === "lander-bn-mo" || mode === "lander-bn-only"
        ? "disable"
        : "unchanged"
  );
  const [leasePayments, setLeasePayments] = useState("36");
  const [switchToCustom, setSwitchToCustom] = useState(true);

  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Array<{
    domain: string;
    ok: boolean;
    message?: string;
  }> | null>(null);
  const [failedItems, setFailedItems] = useState<PreviewRow[]>([]);

  const preview = useMemo<PreviewRow[]>(() => {
    return candidates.map((candidate) => {
      const listing = candidate.listing;
      const changes: AfternicPatchChanges = {};
      const currentParts: string[] = [];
      const nextParts: string[] = [];

      let skipReason: string | null = null;

      if (listing.list_status === "ON_HOLD" || listing.list_status === "SOLD") {
        skipReason = listing.list_status === "ON_HOLD" ? "On hold" : "Sold";
      }

      let resultingBuynow = listing.buynow_price !== null ? Math.round(listing.buynow_price) : null;

      if (changeBuynow) {
        const next = computeBuynow(priceRule, Number(fixedPrice) || 0, candidate);
        if (next === null) {
          skipReason =
            priceRule === "sedo"
              ? "No Sedo price"
              : priceRule === "spaceship"
                ? "No Spaceship price"
                : "No BIN";
        } else if (next > MAX_BUYNOW_USD) {
          skipReason = "Price too high";
        } else {
          changes.buynow = next;
          resultingBuynow = next;
          currentParts.push(
            listing.buynow_price
              ? `$${Math.round(listing.buynow_price).toLocaleString("en-US")}`
              : "—"
          );
          nextParts.push(`$${next.toLocaleString("en-US")}`);
        }
      }

      if (changeMinbid && !skipReason) {
        if (!resultingBuynow || resultingBuynow <= 0) {
          skipReason = "No Buy Now";
        } else {
          const raw =
            minbidRule === "custom"
              ? Number(minbidCustom) || 0
              : resultingBuynow * (Number(minbidRule) / 100);
          const next = clampMinbid(raw);

          if (minbidRule === "custom" && raw < MIN_BID_USD) {
            skipReason = `Min offer min $${MIN_BID_USD}`;
          } else if (next > resultingBuynow) {
            skipReason = "Min offer > Buy Now";
          } else {
            changes.minbid = next;
            currentParts.push(
              listing.minbid_price
                ? `min $${Math.round(listing.minbid_price).toLocaleString("en-US")}`
                : "min —"
            );
            nextParts.push(`min $${next.toLocaleString("en-US")}`);
          }
        }
      }

      if (changeLander) {
        changes.intakeStyle = intakeStyle;
        currentParts.push(listing.intake_style);
        nextParts.push(intakeStyle);
      }

      if (changeVisibility) {
        changes.hidden = hidden;
        currentParts.push(listing.hidden ? "Hidden" : "Visible");
        nextParts.push(hidden ? "Hidden" : "Visible");
      }

      if (changeLanderOptions && !skipReason) {
        const currentCustom = listing.intake_style === "CUSTOM_LANDER";
        const targetCustom = currentCustom || switchToCustom;
        const onlyDisableLease =
          leaseMode === "disable" && buynowMode === "unchanged" && makeOfferMode === "unchanged";
        const currentFlags: LanderOptions = currentCustom
          ? {
              buynow: listing.show_lander_buynow,
              makeOffer: listing.show_lander_makeoffer,
              lease: listing.show_lander_lease,
            }
          : { buynow: true, makeOffer: false, lease: false };

        const nextFlags: LanderOptions = {
          buynow: applyMode(currentFlags.buynow, buynowMode),
          makeOffer: applyMode(currentFlags.makeOffer, makeOfferMode),
          lease: applyMode(currentFlags.lease, leaseMode),
        };

        if (!targetCustom || (!currentCustom && onlyDisableLease)) {
          skipReason = "NOT_CUSTOM";
        } else if (nextFlags.buynow && !(resultingBuynow !== null && resultingBuynow > 0)) {
          skipReason = "NO_BUYNOW";
        } else if (
          nextFlags.makeOffer &&
          !(listing.minbid_price !== null && listing.minbid_price >= MIN_BID_USD)
        ) {
          skipReason = "NO_MINBID";
        } else if (nextFlags.lease && !(resultingBuynow !== null && resultingBuynow > 0)) {
          skipReason = "NO_BUYNOW";
        } else if (!nextFlags.buynow && !nextFlags.makeOffer && !nextFlags.lease) {
          skipReason = "NO_OPTION_LEFT";
        } else {
          const period = Math.min(60, Math.max(2, Number(leasePayments) || 2));

          changes.intakeStyle = "CUSTOM_LANDER";
          changes.landingPage = "SALES_TYPE";

          if (nextFlags.buynow !== currentFlags.buynow) {
            changes.showLanderBuynowOption = nextFlags.buynow;
          }
          if (nextFlags.makeOffer !== currentFlags.makeOffer) {
            changes.showLanderMakeOfferOption = nextFlags.makeOffer;
          }
          if (nextFlags.lease !== currentFlags.lease) {
            changes.showLanderLeaseToOwnOption = nextFlags.lease;
          }
          if (nextFlags.lease) {
            changes.leasingEnabled = true;
            changes.maxLeasePeriod = period;
          } else if (currentFlags.lease) {
            changes.leasingEnabled = false;
            changes.showLanderLeaseToOwnOption = false;
          }

          currentParts.push(currentCustom ? listingLanderBadge(listing) || "Custom" : "Non-custom");
          nextParts.push(landerBadge(nextFlags));
        }
      }

      return {
        id: candidate.id,
        domain: candidate.domain,
        current: currentParts.join(" · ") || "—",
        next: nextParts.join(" · ") || "—",
        skipReason,
        changes,
      };
    });
  }, [
    candidates,
    changeBuynow,
    priceRule,
    fixedPrice,
    changeMinbid,
    minbidRule,
    minbidCustom,
    changeLander,
    intakeStyle,
    changeVisibility,
    hidden,
    changeLanderOptions,
    buynowMode,
    makeOfferMode,
    leaseMode,
    leasePayments,
    switchToCustom,
  ]);

  const included = preview.filter((row) => !row.skipReason && Object.keys(row.changes).length > 0);
  const skipped = preview.filter((row) => row.skipReason || Object.keys(row.changes).length === 0);
  const hasSelection =
    changeBuynow || changeMinbid || changeLander || changeVisibility || changeLanderOptions;

  const cancelledRef = useRef(false);

  async function run(items: PreviewRow[]) {
    if (items.length === 0) return;
    setRunning(true);
    cancelledRef.current = false;

    const succeededAll: Array<{
      domain: string;
      payload: AfternicCachePayload;
    }> = [];
    const failedAll: Array<{ domain: string; message: string }> = [];

    try {
      const chunkSize = 50;

      for (let i = 0; i < items.length; i += chunkSize) {
        if (cancelledRef.current) break;

        const chunk = items.slice(i, i + chunkSize);
        const response = await fetch("/api/afternic/bulk-edit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: chunk.map((row) => ({
              domain: row.domain,
              changes: row.changes,
            })),
          }),
        });

        const body = await response.json().catch(() => ({}));
        if (!response.ok || body.error) {
          throw new Error(body.error ?? "Bulk edit failed");
        }

        succeededAll.push(
          ...((body.data?.succeeded ?? []) as Array<{
            domain: string;
            payload: AfternicCachePayload;
          }>)
        );
        failedAll.push(
          ...((body.data?.failed ?? []) as Array<{
            domain: string;
            message: string;
          }>)
        );

        setResults([
          ...succeededAll.map((item) => ({ domain: item.domain, ok: true })),
          ...failedAll.map((item) => ({
            domain: item.domain,
            ok: false,
            message: item.message,
          })),
        ]);
      }

      const idByDomain = new Map(
        candidates.map((candidate) => [candidate.domain.toLowerCase(), candidate.id])
      );

      for (const item of succeededAll) {
        const domainId = idByDomain.get(item.domain.toLowerCase());
        if (domainId && item.payload) {
          await upsertAfternicListing({ ...item.payload, domain_id: domainId });
        }
      }

      const failedDomains = new Set(failedAll.map((f) => f.domain.toLowerCase()));

      setResults([
        ...succeededAll.map((item) => ({ domain: item.domain, ok: true })),
        ...failedAll.map((item) => ({
          domain: item.domain,
          ok: false,
          message: item.message,
        })),
      ]);
      setFailedItems(items.filter((row) => failedDomains.has(row.domain.toLowerCase())));

      const refreshed = succeededAll
        .map((item) => {
          const domainId = idByDomain.get(item.domain.toLowerCase());
          return domainId ? { id: domainId, domain: item.domain } : null;
        })
        .filter((item): item is { id: string; domain: string } => item !== null);

      if (refreshed.length > 0) onRecheck?.(refreshed);

      queryClient.invalidateQueries({ queryKey: queryKeys.afternicListings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.domains.all });

      if (cancelledRef.current) {
        toast.message(
          `Stopped after ${succeededAll.length + failedAll.length} domains. Applied changes were kept.`
        );
      } else {
        toast.success(
          `${succeededAll.length} Afternic listing${succeededAll.length === 1 ? "" : "s"} updated`
        );
        if (failedAll.length === 0) onComplete();
      }
    } catch (err) {
      if (succeededAll.length > 0) {
        setResults([
          ...succeededAll.map((item) => ({ domain: item.domain, ok: true })),
          ...failedAll.map((item) => ({
            domain: item.domain,
            ok: false,
            message: item.message,
          })),
        ]);
      }
      toast.error(err instanceof Error ? err.message : "Bulk edit failed");
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
            Edit {included.length} Afternic listing{included.length === 1 ? "" : "s"}
          </DialogTitle>
          <DialogDescription>
            Only the fields you tick are sent. Everything else stays unchanged.
          </DialogDescription>
        </DialogHeader>

        {!results ? (
          <div className="space-y-4">
            <div className="space-y-3 rounded-lg border border-border p-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={changeBuynow}
                  onChange={(e) => setChangeBuynow(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                Buy Now price
              </label>
              {changeBuynow && (
                <div className="grid gap-2 pl-6 sm:grid-cols-2">
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
                      <SelectItem value="sedo">Use each domain&apos;s Sedo price</SelectItem>
                      <SelectItem value="spaceship">
                        Use each domain&apos;s Spaceship price
                      </SelectItem>
                      <SelectItem value="fixed">Fixed price</SelectItem>
                    </SelectContent>
                  </Select>
                  {priceRule === "fixed" && (
                    <Input
                      type="number"
                      step="1"
                      min="1"
                      value={fixedPrice}
                      onChange={(e) => setFixedPrice(e.target.value)}
                      placeholder="Fixed price"
                    />
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3 rounded-lg border border-border p-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={changeMinbid}
                  onChange={(e) => setChangeMinbid(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                Min offer
              </label>
              {changeMinbid && (
                <div className="grid gap-2 pl-6 sm:grid-cols-2">
                  <Select
                    value={minbidRule}
                    onValueChange={(value) => setMinbidRule(value as MinbidRule)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20">20% of Buy Now</SelectItem>
                      <SelectItem value="30">30% of Buy Now</SelectItem>
                      <SelectItem value="40">40% of Buy Now</SelectItem>
                      <SelectItem value="50">50% of Buy Now</SelectItem>
                      <SelectItem value="custom">Custom amount</SelectItem>
                    </SelectContent>
                  </Select>
                  {minbidRule === "custom" && (
                    <Input
                      type="number"
                      step="1"
                      min={MIN_BID_USD}
                      value={minbidCustom}
                      onChange={(e) => setMinbidCustom(e.target.value)}
                      placeholder={`Min offer (min $${MIN_BID_USD})`}
                    />
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3 rounded-lg border border-border p-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={changeLander}
                  onChange={(e) => setChangeLander(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                Lander
              </label>
              {changeLander && (
                <div className="pl-6">
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
              )}
            </div>

            <div className="space-y-3 rounded-lg border border-border p-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={changeVisibility}
                  onChange={(e) => setChangeVisibility(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                Visibility
              </label>
              {changeVisibility && (
                <div className="pl-6">
                  <Select
                    value={hidden ? "hidden" : "visible"}
                    onValueChange={(value) => setHidden(value === "hidden")}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visible">Visible</SelectItem>
                      <SelectItem value="hidden">Hidden</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-3 rounded-lg border border-border p-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={changeLanderOptions}
                  onChange={(e) => setChangeLanderOptions(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                Custom lander options
              </label>
              {changeLanderOptions && (
                <div className="space-y-3 pl-6">
                  <ThreeWaySelect label="Buy Now" value={buynowMode} onChange={setBuynowMode} />
                  <ThreeWaySelect
                    label="Make Offer"
                    value={makeOfferMode}
                    onChange={setMakeOfferMode}
                  />
                  <ThreeWaySelect label="Lease to Own" value={leaseMode} onChange={setLeaseMode} />
                  {leaseMode === "enable" && (
                    <div className="flex items-center gap-2">
                      <Label htmlFor="bulk-lease-payments" className="text-xs">
                        Payments
                      </Label>
                      <Input
                        id="bulk-lease-payments"
                        type="number"
                        min={2}
                        max={60}
                        value={leasePayments}
                        onChange={(e) => setLeasePayments(e.target.value)}
                        className="h-8 w-24"
                      />
                    </div>
                  )}
                  <label className="flex items-center gap-2 text-xs text-text-muted">
                    <input
                      type="checkbox"
                      checked={switchToCustom}
                      onChange={(e) => setSwitchToCustom(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-border"
                    />
                    Switch domains not on a Custom lander to Custom
                  </label>
                </div>
              )}
            </div>

            <div className="overflow-hidden rounded-lg border border-border">
              <div className="max-h-56 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-bg-elevated text-xs text-text-muted">
                    <tr>
                      <th className="px-3 py-2 text-left">Domain</th>
                      <th className="px-3 py-2 text-left">Current → New</th>
                      <th className="px-3 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 10).map((row) => (
                      <tr key={row.id} className="border-t border-border/50">
                        <td className="px-3 py-1.5 font-mono text-xs">{row.domain}</td>
                        <td className="px-3 py-1.5 text-xs">
                          {row.current} → <span className="font-medium">{row.next}</span>
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
                {skipped.length} skipped (on hold / sold / no BIN / no change) · {included.length}{" "}
                will be updated
              </p>
            )}
            {!hasSelection && (
              <p className="text-xs text-accent-warning">Tick at least one field to change.</p>
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
            {failedItems.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                disabled={running}
                onClick={() => run(failedItems)}
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
          {running && (
            <Button
              variant="outline"
              onClick={() => {
                cancelledRef.current = true;
              }}
            >
              Stop after this batch
            </Button>
          )}
          {!results && !running && (
            <Button onClick={() => run(included)} disabled={included.length === 0 || !hasSelection}>
              Apply to {included.length} domains
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
