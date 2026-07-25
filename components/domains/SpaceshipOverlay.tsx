"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { askingPriceSuggestions, minPriceSuggestions } from "@/lib/sedo/pricing";
import { upsertSpaceshipListing, deleteSpaceshipListing } from "@/lib/supabase/queries/spaceship-listings-client";
import type { SpaceshipListing } from "@/types/spaceship";

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
}

export function SpaceshipOverlay({ open, domain, existingListing, onClose, onSuccess, batch, batchDomains }: SpaceshipOverlayProps) {
  const isEdit = !batch && !!existingListing;
  const queryClient = useQueryClient();

  const [askingPrice, setAskingPrice] = useState("");
  const [minOffer, setMinOffer] = useState("");
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

  const handleSubmit = useCallback(async () => {
    setError("");

    if (!askingPrice || isNaN(Number(askingPrice)) || Number(askingPrice) <= 0) {
      setError("Asking Price is required");
      return;
    }

    setLoading(true);
    try {
      if (batch && batchDomains?.length) {
        const batchResponse = await fetch("/api/spaceship/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            price: Number(askingPrice),
            minprice: Number(minOffer) || 0,
            domainIds: batchDomains.map((d) => d.id),
          }),
        });

        const batchBody = await batchResponse.json();

        if (!batchResponse.ok || batchBody.error) {
          throw new Error(batchBody.error ?? "Spaceship API error");
        }

        

        for (const d of batchDomains) {
          await upsertSpaceshipListing({
            domain_id: d.id,
            domain_name: d.domain,
            spaceship_price: Number(askingPrice),
            spaceship_minprice: Number(minOffer) || 0,
            spaceship_currency: "USD",
          });
        }

        if (batchBody.data?.errors?.length) {
          toast.warning(`${batchBody.data.errors.length} domains had errors`);
        } else {
          toast.success(`${batchDomains.length} domains updated on Spaceship`);
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
  }, [askingPrice, minOffer, domain, existingListing, bin, onClose, onSuccess, queryClient]);

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
                : `List on Spaceship — ${domain?.domain}`
            }
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
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
              <span>{domain?.expiration_date ? new Date(domain.expiration_date).toLocaleDateString() : ""}</span>
            </div>
          </div>
          <div className="border-t border-border" />
          </>
          )}

          {noCredentials && (
            <p className="text-sm text-accent-danger">Add Spaceship credentials in Settings first</p>
          )}

          <div className="space-y-2">
            <Label>Asking Price *</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={askingPrice}
              onChange={(e) => setAskingPrice(e.target.value)}
              placeholder="0.00"
              disabled={loading || noCredentials}
            />

            {askSuggestions.length > 0 && (
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

            {minPriceChips.length > 0 && (
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
                <Button variant="ghost" size="sm" onClick={() => setShowRemoveConfirm(false)} disabled={loading}>
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
            <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            {noCredentials ? (
              <Button disabled title="Add Spaceship credentials in Settings first">
                {batch ? `Apply to ${batchDomains?.length ?? 0} domains` : isEdit ? "Update" : "List on Spaceship"}
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                    Processing...
                  </span>
                ) : batch ? `Apply to ${batchDomains?.length ?? 0} domains` : isEdit ? "Update" : "List on Spaceship"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
