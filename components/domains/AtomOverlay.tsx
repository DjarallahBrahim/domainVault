"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, DollarSign, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { atomPriceSuggestions, isAtomRemovable } from "@/lib/atom/pricing";
import { atomTypeHint } from "@/components/domains/AtomCell";
import { deleteAtomListing, upsertAtomListing } from "@/lib/supabase/queries/atom-listings-client";
import type { AtomCachePayload } from "@/lib/atom/mappers";
import type { AtomListing, AtomListingType } from "@/types/atom";

interface AtomOverlayProps {
  open: boolean;
  onClose: () => void;
  domain: {
    id: string;
    domain: string;
    registrar: string | null;
    expiration_date: string;
    bin?: number | null;
  } | null;
  existingListing: AtomListing | null;
  onSuccess: () => void;
}

const TYPE_OPTIONS = [
  { value: "standard", label: "Standard" },
  { value: "geo", label: "Geo" },
  { value: "premium", label: "Premium" },
];

export function AtomOverlay({
  open,
  domain,
  existingListing,
  onClose,
  onSuccess,
}: AtomOverlayProps) {
  const isEdit = Boolean(existingListing);
  const queryClient = useQueryClient();
  const bin = domain?.bin ?? null;

  const [price, setPrice] = useState("");
  const [listingType, setListingType] = useState<AtomListingType>("standard");
  const [confirmPremium, setConfirmPremium] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [noCredentials, setNoCredentials] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (existingListing) {
      setPrice(
        existingListing.selling_price !== null
          ? String(Math.round(existingListing.selling_price))
          : ""
      );
      setListingType(existingListing.listing_type);
    } else {
      setPrice(bin ? String(Math.round(bin)) : "");
      setListingType("standard");
    }

    setConfirmPremium(false);
    setError("");
    setShowRemoveConfirm(false);

    async function checkCredentials() {
      const supabase = createClient();
      const { data } = await supabase
        .from("user_settings")
        .select("atom_api_token, atom_user_id")
        .maybeSingle();
      const row = data as Record<string, unknown> | null;
      setNoCredentials(!(row?.atom_api_token && row?.atom_user_id));
    }

    checkCredentials();
  }, [open, existingListing, bin]);

  const priceNum = Math.round(Number(price)) || 0;
  const chips = existingListing ? [] : atomPriceSuggestions(bin);
  const canRemove = !existingListing || isAtomRemovable(existingListing.listing_type);

  const handleSubmit = useCallback(async () => {
    setError("");

    if (!priceNum || priceNum <= 0) {
      setError("Selling price is required");
      return;
    }
    if (!isEdit && listingType === "premium" && !confirmPremium) {
      setError("Confirm the 1-coin spend to list as Premium");
      return;
    }

    setLoading(true);
    try {
      if (!isEdit) {
        const response = await fetch("/api/atom/insert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            domain: domain!.domain,
            price: priceNum,
            domainType: listingType,
            confirmPremium,
          }),
        });

        const body = await response.json().catch(() => ({}));
        if (!response.ok || body.error) {
          throw new Error(body.error ?? "Atom API error");
        }

        const payload = body.data?.payload as AtomCachePayload | undefined;
        if (payload) {
          await upsertAtomListing({ ...payload, domain_id: domain!.id });
        }

        queryClient.invalidateQueries({ queryKey: queryKeys.atomListings.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.domains.all });

        toast.success(
          body.data?.warning
            ? `${domain!.domain} submitted to Atom — syncing details shortly`
            : `${domain!.domain} listed on Atom`
        );
      } else {
        const response = await fetch("/api/atom/edit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain: domain!.domain, price: priceNum }),
        });

        const body = await response.json().catch(() => ({}));
        if (!response.ok || body.error) {
          throw new Error(body.error ?? "Atom API error");
        }

        await upsertAtomListing({
          domain_id: domain!.id,
          domain_name: existingListing!.domain_name,
          atom_id: existingListing!.atom_id,
          list_status: existingListing!.list_status,
          listing_type: existingListing!.listing_type,
          listing_type_raw: existingListing!.listing_type_raw,
          selling_price: priceNum,
          full_price: existingListing!.full_price,
          discount: existingListing!.discount,
          primary_category: existingListing!.primary_category,
          logo_image: existingListing!.logo_image,
          listed_at: existingListing!.listed_at,
        });

        queryClient.invalidateQueries({ queryKey: queryKeys.atomListings.all });
        toast.success("Atom listing updated");
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach Atom. Try again.");
    } finally {
      setLoading(false);
    }
  }, [
    confirmPremium,
    domain,
    isEdit,
    listingType,
    onClose,
    onSuccess,
    priceNum,
    queryClient,
    existingListing,
  ]);

  const handleRemove = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/atom/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: domain!.domain,
          listingType: existingListing?.listing_type,
        }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok || body.error) {
        throw new Error(body.error ?? "Atom API error");
      }

      await deleteAtomListing(domain!.id);
      queryClient.invalidateQueries({ queryKey: queryKeys.atomListings.all });
      toast.success(`${domain!.domain} removed from Atom`);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach Atom. Try again.");
    } finally {
      setLoading(false);
    }
  }, [domain, existingListing, onClose, onSuccess, queryClient]);

  if (!open || !domain) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/50" onClick={onClose} />

      <div className="fixed inset-x-0 bottom-0 z-[60] w-full max-h-[90vh] overflow-y-auto rounded-t-2xl border-t border-border bg-bg-surface p-0 pb-20 shadow-2xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[85vh] sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border sm:pb-0">
        <div className="flex items-center justify-between border-b border-border p-6">
          <h2 className="font-display text-lg font-bold">
            {isEdit ? `Edit Listing — ${domain.domain}` : `List on Atom — ${domain.domain}`}
          </h2>
          <button
            onClick={onClose}
            className="text-text-muted transition-colors hover:text-text-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Domain</span>
              <span className="font-mono">{domain.domain}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Registrar</span>
              <span>{domain.registrar || "\u2014"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Expires</span>
              <span>
                {domain.expiration_date
                  ? new Date(domain.expiration_date).toLocaleDateString()
                  : ""}
              </span>
            </div>
            {isEdit && existingListing && (
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-accent-primary/10 px-2 py-0.5 font-medium text-accent-primary ring-1 ring-accent-primary/20"
                  title={atomTypeHint(existingListing.listing_type)}
                >
                  {existingListing.list_status}
                </span>
                <span className="text-text-muted">
                  {existingListing.listing_type_raw ?? existingListing.listing_type}
                </span>
              </div>
            )}
          </div>

          <div className="border-t border-border" />

          {noCredentials && (
            <p className="text-sm text-accent-danger">Add Atom credentials in Settings first</p>
          )}

          {!isEdit && (
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
              <p className="text-xs text-text-muted">{atomTypeHint(listingType)}.</p>
            </div>
          )}

          {!isEdit && listingType === "premium" && (
            <div className="space-y-3 rounded-xl border border-accent-warning/40 bg-accent-warning/10 p-4">
              <div className="flex items-start gap-2 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent-warning" />
                <div>
                  <p className="font-medium text-accent-warning">Premium uses 1 coin</p>
                  <p className="text-xs text-text-muted">
                    The listing is submitted for review and cannot be removed through the API.
                    Removal requires a 30-day notice to Atom.
                  </p>
                </div>
              </div>
              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={confirmPremium}
                  onChange={(e) => setConfirmPremium(e.target.checked)}
                  disabled={loading}
                  className="mt-0.5 h-4 w-4 rounded border-border"
                />
                <span>
                  I understand 1 coin will be spent and this cannot be undone via the API.
                </span>
              </label>
            </div>
          )}

          <div className="space-y-2">
            <Label>Selling Price * (USD, whole dollars)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input
                type="number"
                step="1"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                className="pl-9"
                disabled={loading || noCredentials}
              />
            </div>
            {chips.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {chips.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => setPrice(String(chip.value))}
                    disabled={loading}
                    className="rounded-md border border-border bg-bg-elevated px-2.5 py-1 text-xs transition-colors hover:border-accent-primary hover:bg-accent-primary/10"
                  >
                    <span className="mr-1 text-text-muted">{chip.label}</span>
                    <span className="font-mono">${chip.value.toLocaleString("en-US")}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-accent-danger">{error}</p>}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button onClick={handleSubmit} disabled={loading || noCredentials}>
              {loading
                ? "Saving..."
                : isEdit
                  ? "Save Price"
                  : listingType === "premium"
                    ? "List as Premium (1 coin)"
                    : "List on Atom"}
            </Button>

            {isEdit && canRemove && (
              <>
                {showRemoveConfirm ? (
                  <div className="flex items-center gap-2">
                    <Button variant="destructive" onClick={handleRemove} disabled={loading}>
                      Confirm remove
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setShowRemoveConfirm(false)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setShowRemoveConfirm(true)}
                    disabled={loading}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                )}
              </>
            )}

            {isEdit && !canRemove && (
              <p className="text-xs text-text-muted">
                {atomTypeHint(existingListing!.listing_type)}.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
