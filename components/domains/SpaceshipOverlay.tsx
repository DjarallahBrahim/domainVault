"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Trash2 } from "lucide-react";
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
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { askingPriceSuggestions, minPriceSuggestions } from "@/lib/sedo/pricing";
import {
  upsertSpaceshipListing,
  deleteSpaceshipListing,
} from "@/lib/supabase/queries/spaceship-listings-client";
import type { SpaceshipListing } from "@/types/spaceship";
import type { AfternicListing } from "@/types/afternic";
import type { SedoListing } from "@/types/sedo";
import type { AtomListing } from "@/types/atom";

interface SpaceshipOverlayProps {
  open: boolean;
  onClose: () => void;
  domain: {
    id: string;
    domain: string;
    registrar: string | null;
    expiration_date: string;
    bin?: number | null;
  } | null;
  existingListing: SpaceshipListing | null;
  onSuccess: () => void;
  batch?: boolean;
  batchDomains?: Array<{ id: string; domain: string }>;
  batchAfternicListings?: Map<string, AfternicListing>;
  batchSedoListings?: Map<string, SedoListing>;
  batchAtomListings?: Map<string, AtomListing>;
}

type SpaceshipPriceSource = "manual" | "afternic" | "sedo" | "atom";

export function SpaceshipOverlay({
  open,
  domain,
  existingListing,
  onClose,
  onSuccess,
  batch,
  batchDomains,
  batchAfternicListings,
  batchSedoListings,
  batchAtomListings,
}: SpaceshipOverlayProps) {
  const isEdit = !batch && !!existingListing;
  const queryClient = useQueryClient();

  const [askingPrice, setAskingPrice] = useState("");
  const [minOffer, setMinOffer] = useState("");
  const [priceSource, setPriceSource] = useState<SpaceshipPriceSource>("manual");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [noCredentials, setNoCredentials] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const bin = domain?.bin ?? null;

  useEffect(() => {
    if (!open) return;

    if (existingListing) {
      setAskingPrice(String(existingListing.spaceship_price));
      setMinOffer(String(existingListing.spaceship_minprice ?? 0));
    } else if (bin) {
      setAskingPrice(String(bin));
      setMinOffer("");
    } else {
      setAskingPrice("");
      setMinOffer("");
    }

    setError("");
    setPriceSource("manual");
    setShowRemoveConfirm(false);

    async function checkCredentials() {
      const supabase = createClient();
      const { data } = await supabase.from("user_settings").select("spaceship_api_key").single();
      setNoCredentials(!(data as Record<string, unknown> | null)?.spaceship_api_key);
    }

    checkCredentials();
  }, [open, existingListing, bin]);

  const askingPriceNum = parseFloat(askingPrice) || 0;
  const askSuggestions = existingListing ? [] : askingPriceSuggestions(bin);
  const minPriceChips = askingPriceNum > 0 ? minPriceSuggestions(askingPriceNum) : [];

  const priceSourceLabel =
    priceSource === "afternic"
      ? "Afternic"
      : priceSource === "sedo"
        ? "Sedo"
        : priceSource === "atom"
          ? "Atom"
          : "manual";

  function priceForDomain(id: string): number {
    if (priceSource === "afternic") {
      return batchAfternicListings?.get(id)?.buynow_price ?? 0;
    }
    if (priceSource === "sedo") {
      return batchSedoListings?.get(id)?.sedo_price ?? 0;
    }
    if (priceSource === "atom") {
      return batchAtomListings?.get(id)?.selling_price ?? 0;
    }
    return Number(askingPrice) || 0;
  }

  const handleSubmit = useCallback(async () => {
    setError("");

    const usingBatchSource = Boolean(batch && priceSource !== "manual");

    if (
      !usingBatchSource &&
      (!askingPrice || isNaN(Number(askingPrice)) || Number(askingPrice) <= 0)
    ) {
      setError("Asking Price is required");
      return;
    }

    setLoading(true);
    try {
      if (batch && batchDomains?.length) {
        const batchItems = batchDomains
          .map((d) => {
            const price = priceForDomain(d.id);
            const minprice =
              minOffer && Number(minOffer) > 0 ? Math.min(Number(minOffer), price) : 0;
            return { ...d, price, minprice };
          })
          .filter((item) => item.price > 0);

        if (batchItems.length === 0) {
          setError(
            priceSource === "manual"
              ? "Asking Price is required"
              : `No selected domains have a ${priceSourceLabel} price`
          );
          setLoading(false);
          return;
        }

        const skipped = batchDomains.length - batchItems.length;

        const batchResponse = await fetch("/api/spaceship/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: batchItems.map((item) => ({
              domainId: item.id,
              price: item.price,
              minprice: item.minprice,
            })),
          }),
        });

        const batchBody = await batchResponse.json();

        if (!batchResponse.ok || batchBody.error) {
          throw new Error(batchBody.error ?? "Spaceship API error");
        }

        for (const d of batchItems) {
          await upsertSpaceshipListing({
            domain_id: d.id,
            domain_name: d.domain,
            spaceship_price: d.price,
            spaceship_minprice: d.minprice,
            spaceship_currency: "USD",
          });
        }

        if (skipped > 0) {
          toast.warning(
            `${skipped} domain${skipped === 1 ? "" : "s"} skipped (no ${priceSourceLabel} price)`
          );
        }
        if (batchBody.data?.errors?.length) {
          toast.warning(`${batchBody.data.errors.length} domains had errors`);
        } else {
          toast.success(`${batchItems.length} domains updated on Spaceship`);
        }

        queryClient.invalidateQueries({ queryKey: queryKeys.spaceshipListings.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.domains.all });
        onSuccess();
        onClose();
        return;
      }

      const endpoint = existingListing ? "/api/spaceship/update" : "/api/spaceship/create";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: domain!.domain,
          price: Number(askingPrice),
          minprice: Number(minOffer) || 0,
        }),
      });

      const body = await response.json();

      if (!response.ok || body.error) {
        throw new Error(body.error ?? "Spaceship API error");
      }

      const supabase = createClient();

      if (!bin && Number(askingPrice) > 0) {
        await supabase
          .from("domains")
          .update({ bin: Number(askingPrice) } as never)
          .eq("id", domain!.id);
      }

      await upsertSpaceshipListing({
        domain_id: domain!.id,
        domain_name: domain!.domain,
        spaceship_domain_id: body.data?.spaceshipId ?? null,
        spaceship_price: Number(askingPrice),
        spaceship_minprice: Number(minOffer) || 0,
        spaceship_currency: "USD",
      });

      queryClient.invalidateQueries({ queryKey: queryKeys.spaceshipListings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.domains.all });

      if (existingListing) {
        toast.success("Spaceship price updated");
      } else {
        toast.success(`${domain!.domain} listed on Spaceship`);
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not reach Spaceship. Try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [
    askingPrice,
    minOffer,
    priceSource,
    priceSourceLabel,
    batch,
    batchDomains,
    batchAfternicListings,
    batchSedoListings,
    batchAtomListings,
    domain,
    existingListing,
    bin,
    onClose,
    onSuccess,
    queryClient,
  ]);

  const handleRemove = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/spaceship/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domain!.domain }),
      });

      const body = await response.json();

      if (!response.ok || body.error) {
        throw new Error(body.error ?? "Spaceship API error");
      }

      await deleteSpaceshipListing(domain!.id);
      queryClient.invalidateQueries({ queryKey: queryKeys.spaceshipListings.all });

      toast.success(`${domain!.domain} removed from Spaceship`);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not reach Spaceship. Try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [domain, onClose, onSuccess, queryClient]);

  if (!open) return null;
  if (!batch && !domain) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/50" onClick={onClose} />

      <div className="fixed inset-x-0 bottom-0 z-[60] w-full max-h-[90vh] overflow-y-auto rounded-t-2xl bg-bg-surface border-t border-border p-0 pb-20 shadow-2xl sm:pb-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-lg sm:rounded-2xl sm:max-h-[85vh] sm:border">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-bold font-display">
            {batch
              ? `Bulk Edit — ${batchDomains?.length ?? 0} domains`
              : isEdit
                ? `Edit Listing — ${domain?.domain}`
                : `List on Spaceship — ${domain?.domain}`}
          </h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {!batch && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Domain</span>
                  <span className="font-mono">{domain?.domain}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Registrar</span>
                  <span>{domain?.registrar || "\u2014"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Expires</span>
                  <span>
                    {domain?.expiration_date
                      ? new Date(domain.expiration_date).toLocaleDateString()
                      : ""}
                  </span>
                </div>
              </div>
              <div className="border-t border-border" />
            </>
          )}

          {noCredentials && (
            <p className="text-sm text-accent-danger">
              Add Spaceship credentials in Settings first
            </p>
          )}

          {batch && (
            <div className="space-y-2">
              <Label>Price source</Label>
              <Select
                value={priceSource}
                onValueChange={(value) => setPriceSource(value as SpaceshipPriceSource)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[80]">
                  <SelectItem value="manual">Manual price</SelectItem>
                  <SelectItem value="afternic">Use each domain&apos;s Afternic Buy Now</SelectItem>
                  <SelectItem value="sedo">Use each domain&apos;s Sedo price</SelectItem>
                  <SelectItem value="atom">Use each domain&apos;s Atom price</SelectItem>
                </SelectContent>
              </Select>
              {priceSource !== "manual" && (
                <p className="text-xs text-text-muted">
                  Asking Price is ignored. Each domain uses its {priceSourceLabel} price; domains
                  without one are skipped.
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>
              {batch && priceSource !== "manual" ? "Asking Price (from source)" : "Asking Price *"}
            </Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={askingPrice}
              onChange={(e) => setAskingPrice(e.target.value)}
              placeholder="0.00"
              disabled={loading || noCredentials || (batch && priceSource !== "manual")}
            />

            {priceSource === "manual" && askSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {askSuggestions.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => setAskingPrice(String(s.value))}
                    disabled={loading}
                    className="px-2.5 py-1 text-xs rounded-md border border-border bg-bg-elevated hover:bg-accent-primary/10 hover:border-accent-primary transition-colors"
                  >
                    <span className="text-text-muted mr-1">{s.label}</span>
                    <span className="font-mono">${s.value.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Min Offer</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={minOffer}
              onChange={(e) => setMinOffer(e.target.value)}
              placeholder="0.00"
              disabled={loading || noCredentials}
            />

            {priceSource === "manual" && minPriceChips.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {minPriceChips.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => setMinOffer(String(s.value))}
                    disabled={loading}
                    className="px-2.5 py-1 text-xs rounded-md border border-border bg-bg-elevated hover:bg-accent-primary/10 hover:border-accent-primary transition-colors"
                  >
                    <span className="text-text-muted mr-1">{s.label}</span>
                    <span className="font-mono">${s.value.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-accent-danger bg-accent-danger/5 border border-accent-danger/20 rounded-md p-3">
              {error}
            </p>
          )}

          {showRemoveConfirm && (
            <div className="p-3 rounded-md border border-accent-danger/30 bg-accent-danger/5">
              <p className="text-sm font-medium mb-2">Remove from Spaceship?</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemove}
                  disabled={loading}
                  className="text-accent-danger border-accent-danger/30 hover:bg-accent-danger/10"
                >
                  {loading ? "Removing..." : "Yes"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRemoveConfirm(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-6 border-t border-border">
          {batch ? (
            <span />
          ) : isEdit ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRemoveConfirm(true)}
              disabled={loading || showRemoveConfirm}
              className="text-accent-danger hover:bg-accent-danger/10"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Remove from Spaceship
            </Button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            {noCredentials ? (
              <Button disabled title="Add Spaceship credentials in Settings first">
                {batch
                  ? `Apply to ${batchDomains?.length ?? 0} domains`
                  : isEdit
                    ? "Update"
                    : "List on Spaceship"}
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                    Processing...
                  </span>
                ) : batch ? (
                  `Apply to ${batchDomains?.length ?? 0} domains`
                ) : isEdit ? (
                  "Update"
                ) : (
                  "List on Spaceship"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
