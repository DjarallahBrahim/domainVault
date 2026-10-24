"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Trash2, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  buynowSuggestions,
  hasCents,
  MAX_BUYNOW_USD,
  minbidSuggestions,
  MIN_BID_USD,
} from "@/lib/afternic/pricing";
import { getFastTransferInfo, FAST_TRANSFER_TONE_CLASS } from "@/lib/afternic/fast-transfer";
import { upsertAfternicListing } from "@/lib/supabase/queries/afternic-listings-client";
import type { AfternicCachePayload } from "@/lib/afternic/mappers";
import type { AfternicEditRequest, AfternicIntakeStyle, AfternicListing } from "@/types/afternic";

interface AfternicOverlayProps {
  open: boolean;
  onClose: () => void;
  domain: {
    id: string;
    domain: string;
    registrar: string | null;
    expiration_date: string;
    bin?: number | null;
  } | null;
  existingListing: AfternicListing | null;
  onSuccess: () => void;
}

const LANDER_OPTIONS = [
  { value: "BUYNOW", label: "Buy it Now" },
  { value: "PRICE_FORM", label: "Request Price" },
  { value: "CUSTOM_LANDER", label: "Custom" },
];

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active",
  PENDING: "Pending",
  FAILED_COMPLIANCE: "Failed compliance",
  HIDDEN: "Hidden",
  ON_HOLD: "On hold",
  SOLD: "Sold",
  INACTIVE: "Inactive",
};

export function AfternicOverlay({
  open,
  domain,
  existingListing,
  onClose,
  onSuccess,
}: AfternicOverlayProps) {
  const isEdit = Boolean(existingListing);
  const queryClient = useQueryClient();

  const [buynow, setBuynow] = useState("");
  const [minbid, setMinbid] = useState("");
  const [floor, setFloor] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [intakeStyle, setIntakeStyle] = useState<AfternicIntakeStyle>("BUYNOW");
  const [hidden, setHidden] = useState(false);
  const [maxLeasePeriod, setMaxLeasePeriod] = useState("2");
  const [showBuynow, setShowBuynow] = useState(true);
  const [showMakeOffer, setShowMakeOffer] = useState(false);
  const [showLease, setShowLease] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [noCredentials, setNoCredentials] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const bin = domain?.bin ?? null;

  useEffect(() => {
    if (!open) return;

    if (existingListing) {
      setBuynow(
        existingListing.buynow_price !== null
          ? String(Math.round(existingListing.buynow_price))
          : ""
      );
      setMinbid(
        existingListing.minbid_price !== null
          ? String(Math.round(existingListing.minbid_price))
          : ""
      );
      setFloor(
        existingListing.floor_price !== null ? String(Math.round(existingListing.floor_price)) : ""
      );
      setDisplayName(existingListing.display_name ?? "");
      setIntakeStyle(existingListing.intake_style ?? "BUYNOW");
      setHidden(existingListing.hidden);
      setMaxLeasePeriod(String(existingListing.max_lease_period ?? 2));
      setShowBuynow(existingListing.show_lander_buynow);
      setShowMakeOffer(existingListing.show_lander_makeoffer);
      setShowLease(existingListing.show_lander_lease);
    } else {
      setBuynow(bin ? String(Math.round(bin)) : "");
      setMinbid("");
      setFloor("");
      setDisplayName("");
      setIntakeStyle("BUYNOW");
      setHidden(false);
      setMaxLeasePeriod("2");
      setShowBuynow(true);
      setShowMakeOffer(false);
      setShowLease(false);
    }

    setShowAdvanced(false);
    setError("");
    setShowRemoveConfirm(false);

    async function checkCredentials() {
      const supabase = createClient();
      const { data } = await supabase
        .from("user_settings")
        .select("afternic_api_key")
        .maybeSingle();
      setNoCredentials(!(data as Record<string, unknown> | null)?.afternic_api_key);
    }

    checkCredentials();
  }, [open, existingListing, bin]);

  const buynowNum = Number(buynow) || 0;
  const minbidNum = Number(minbid) || 0;
  const buynowChips = existingListing ? [] : buynowSuggestions(bin);
  const minbidChips = buynowNum > 0 ? minbidSuggestions(buynowNum) : [];

  const monthlyEstimate = useMemo(() => {
    const payments = Number(maxLeasePeriod) || 0;
    if (!buynowNum || payments < 2) return null;
    return buynowNum / payments;
  }, [buynowNum, maxLeasePeriod]);

  const centsWarning = buynow && hasCents(Number(buynow));

  function getChanges(): AfternicEditRequest | null {
    if (!existingListing || !domain) return null;

    const changes: AfternicEditRequest = { domain: domain.domain };
    let count = 0;

    if (buynowNum !== (existingListing.buynow_price ?? 0)) {
      changes.buynow = buynowNum;
      count += 1;
    }
    if (minbidNum !== (existingListing.minbid_price ?? 0)) {
      changes.minbid = minbidNum;
      count += 1;
    }
    if ((Number(floor) || 0) !== (existingListing.floor_price ?? 0)) {
      changes.floor = Number(floor) || 0;
      count += 1;
    }
    if ((displayName.trim() || null) !== existingListing.display_name) {
      changes.displayName = displayName.trim();
      count += 1;
    }
    if (intakeStyle !== existingListing.intake_style) {
      changes.intakeStyle = intakeStyle;
      count += 1;
    }
    if (hidden !== existingListing.hidden) {
      changes.hidden = hidden;
      count += 1;
    }
    if (intakeStyle === "CUSTOM_LANDER") {
      const payments = Math.min(60, Math.max(2, Number(maxLeasePeriod) || 2));

      if (showBuynow !== existingListing.show_lander_buynow) {
        changes.showLanderBuynowOption = showBuynow;
        count += 1;
      }
      if (showMakeOffer !== existingListing.show_lander_makeoffer) {
        changes.showLanderMakeOfferOption = showMakeOffer;
        count += 1;
      }
      if (showLease !== existingListing.show_lander_lease) {
        changes.showLanderLeaseToOwnOption = showLease;
        count += 1;
      }

      if (showLease) {
        if (!existingListing.leasing_enabled) {
          changes.leasingEnabled = true;
          count += 1;
        }
        if (payments !== (existingListing.max_lease_period ?? 2)) {
          changes.maxLeasePeriod = payments;
          count += 1;
        }
      } else if (existingListing.show_lander_lease) {
        changes.leasingEnabled = false;
        changes.showLanderLeaseToOwnOption = false;
        count += 1;
      }
    }

    return count > 0 ? changes : null;
  }

  function validate(): string | null {
    if (!buynowNum || buynowNum <= 0) return "Buy Now price is required";
    if (buynowNum > MAX_BUYNOW_USD) {
      return `Buy Now price cannot exceed $${MAX_BUYNOW_USD.toLocaleString("en-US")}`;
    }
    if (minbid && minbidNum < MIN_BID_USD) {
      return `Minimum offer must be at least $${MIN_BID_USD}`;
    }
    if (minbid && minbidNum > buynowNum) {
      return "Minimum offer cannot be higher than the Buy Now price";
    }

    if (intakeStyle === "CUSTOM_LANDER") {
      if (!showBuynow && !showMakeOffer && !showLease) {
        return "Choose at least one sales method";
      }
      if (showBuynow && buynowNum <= 0) {
        return "Buy Now requires a Buy Now price";
      }
      if (showMakeOffer && (!minbid || minbidNum < MIN_BID_USD)) {
        return `Make Offer requires a minimum offer of at least $${MIN_BID_USD}`;
      }
      if (showLease) {
        if (buynowNum <= 0) {
          return "Lease to Own requires a Buy Now price";
        }
        const payments = Number(maxLeasePeriod);
        if (!Number.isFinite(payments) || payments < 2 || payments > 60) {
          return "Lease to Own payments must be between 2 and 60";
        }
      }
    }

    return null;
  }

  function apiError(body: { error?: string; fields?: Array<{ message?: string }> }): Error {
    const fieldMessages = Array.isArray(body.fields)
      ? body.fields
          .map((field) => field.message)
          .filter((message): message is string => Boolean(message))
      : [];

    return new Error(
      [body.error ?? "Afternic API error", ...fieldMessages].filter(Boolean).join(" — ")
    );
  }

  const handleSubmit = useCallback(async () => {
    setError("");

    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();

      if (!isEdit) {
        if (!bin && buynowNum > 0) {
          await supabase
            .from("domains")
            .update({ bin: buynowNum } as never)
            .eq("id", domain!.id);
        }

        const response = await fetch("/api/afternic/insert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            domain: domain!.domain,
            buynow: buynowNum,
            minbid: minbid ? minbidNum : null,
            floor: floor ? Number(floor) : null,
            displayName: displayName.trim() || null,
            intakeStyle,
            leasingEnabled: intakeStyle === "CUSTOM_LANDER" ? showLease : false,
            maxLeasePeriod:
              intakeStyle === "CUSTOM_LANDER" && showLease
                ? Math.min(60, Math.max(2, Number(maxLeasePeriod) || 2))
                : null,
            showLanderLeaseToOwnOption: intakeStyle === "CUSTOM_LANDER" ? showLease : undefined,
            showLanderBuynowOption: intakeStyle === "CUSTOM_LANDER" ? showBuynow : undefined,
            showLanderMakeOfferOption: intakeStyle === "CUSTOM_LANDER" ? showMakeOffer : undefined,
          }),
        });

        const body = await response.json().catch(() => ({}));
        if (!response.ok || body.error) {
          throw apiError(body);
        }

        const payload = body.data?.payload as AfternicCachePayload;
        if (payload) {
          await upsertAfternicListing({ ...payload, domain_id: domain!.id });
        }

        queryClient.invalidateQueries({ queryKey: queryKeys.afternicListings.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.domains.all });

        toast.success(
          body.data?.alreadyExisted
            ? `${domain!.domain} was already on Afternic — synced`
            : `${domain!.domain} submitted to Afternic`
        );
      } else {
        const changes = getChanges();
        if (!changes) {
          setError("No changes to save");
          setLoading(false);
          return;
        }

        const response = await fetch("/api/afternic/edit", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(changes),
        });

        const body = await response.json().catch(() => ({}));
        if (!response.ok || body.error) {
          throw apiError(body);
        }

        const payload = body.data?.payload as AfternicCachePayload;
        if (payload) {
          await upsertAfternicListing({ ...payload, domain_id: domain!.id });
        }

        queryClient.invalidateQueries({ queryKey: queryKeys.afternicListings.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.domains.all });

        toast.success("Afternic listing updated");
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach Afternic. Try again.");
    } finally {
      setLoading(false);
    }
  }, [
    bin,
    buynowNum,
    displayName,
    domain,
    floor,
    hidden,
    intakeStyle,
    isEdit,
    maxLeasePeriod,
    minbid,
    minbidNum,
    onClose,
    onSuccess,
    queryClient,
    showBuynow,
    showLease,
    showMakeOffer,
    existingListing,
  ]);

  const handleRemove = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/afternic/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domain!.domain }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok || body.error) {
        throw new Error(body.error ?? "Afternic API error");
      }

      const supabase = createClient();
      await supabase.from("afternic_listings").delete().eq("domain_id", domain!.id);
      queryClient.invalidateQueries({ queryKey: queryKeys.afternicListings.all });

      toast.success(`${domain!.domain} removed from Afternic`);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach Afternic. Try again.");
    } finally {
      setLoading(false);
    }
  }, [domain, onClose, onSuccess, queryClient]);

  if (!open || !domain) return null;

  const ft = getFastTransferInfo(existingListing?.fast_transfer_status);

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/50" onClick={onClose} />

      <div className="fixed inset-x-0 bottom-0 z-[60] w-full max-h-[90vh] overflow-y-auto rounded-t-2xl border-t border-border bg-bg-surface p-0 pb-20 shadow-2xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[85vh] sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border sm:pb-0">
        <div className="flex items-center justify-between border-b border-border p-6">
          <h2 className="font-display text-lg font-bold">
            {isEdit ? `Edit Listing — ${domain.domain}` : `List on Afternic — ${domain.domain}`}
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
                <span className="inline-flex items-center gap-1 rounded-full bg-accent-primary/10 px-2 py-0.5 font-medium text-accent-primary ring-1 ring-accent-primary/20">
                  {STATUS_LABEL[existingListing.list_status] ?? existingListing.list_status}
                </span>
                {ft && (
                  <span
                    title={ft.hint}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ring-1 ${FAST_TRANSFER_TONE_CLASS[ft.tone]}`}
                  >
                    <Zap className="h-3 w-3" aria-hidden />
                    Fast Transfer: {ft.label}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-border" />

          {noCredentials && (
            <p className="text-sm text-accent-danger">Add Afternic credentials in Settings first</p>
          )}

          <div className="space-y-2">
            <Label>Buy Now Price * (whole dollars)</Label>
            <Input
              type="number"
              step="1"
              min="1"
              max={MAX_BUYNOW_USD}
              value={buynow}
              onChange={(e) => setBuynow(e.target.value)}
              placeholder="0"
              disabled={loading || noCredentials}
            />
            {centsWarning && (
              <p className="text-xs text-accent-warning">
                Afternic accepts whole dollars — this will be rounded to $
                {Math.round(Number(buynow)).toLocaleString("en-US")}.
              </p>
            )}
            {buynowChips.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {buynowChips.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => setBuynow(String(chip.value))}
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

          <div className="space-y-2">
            <Label>Min Offer (min ${MIN_BID_USD})</Label>
            <Input
              type="number"
              step="1"
              min={MIN_BID_USD}
              value={minbid}
              onChange={(e) => setMinbid(e.target.value)}
              placeholder="Optional"
              disabled={loading || noCredentials}
            />
            {minbidChips.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {minbidChips.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => setMinbid(String(chip.value))}
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

          <div className="space-y-2">
            <Label>Lander</Label>
            <Segmented
              size="sm"
              aria-label="Afternic lander"
              options={LANDER_OPTIONS}
              value={intakeStyle}
              onChange={(value) => {
                const next = value as AfternicIntakeStyle;
                setIntakeStyle(next);
                if (next === "CUSTOM_LANDER" && !showBuynow && !showMakeOffer && !showLease) {
                  setShowBuynow(true);
                }
              }}
            />
          </div>

          {intakeStyle === "CUSTOM_LANDER" && (
            <div className="space-y-3 rounded-xl border border-border bg-bg-elevated/40 p-4">
              <div>
                <p className="text-sm font-medium">Show on lander</p>
                <p className="text-xs text-text-muted">Choose at least one sales method.</p>
              </div>

              <label className="flex min-h-[44px] cursor-pointer items-start gap-3 py-1 text-sm">
                <input
                  type="checkbox"
                  checked={showBuynow}
                  onChange={(e) => setShowBuynow(e.target.checked)}
                  disabled={loading || noCredentials || buynowNum <= 0}
                  className="mt-0.5 h-4 w-4 rounded border-border"
                />
                <span>
                  Buy Now
                  {buynowNum <= 0 && (
                    <span className="block text-[11px] text-accent-warning">
                      Set a Buy Now price first
                    </span>
                  )}
                </span>
              </label>

              <label className="flex min-h-[44px] cursor-pointer items-start gap-3 py-1 text-sm">
                <input
                  type="checkbox"
                  checked={showMakeOffer}
                  onChange={(e) => setShowMakeOffer(e.target.checked)}
                  disabled={loading || noCredentials || minbidNum < MIN_BID_USD}
                  className="mt-0.5 h-4 w-4 rounded border-border"
                />
                <span>
                  Make Offer
                  {minbidNum < MIN_BID_USD && (
                    <span className="block text-[11px] text-accent-warning">
                      Set a minimum offer (min ${MIN_BID_USD})
                    </span>
                  )}
                </span>
              </label>

              <label className="flex min-h-[44px] cursor-pointer items-start gap-3 py-1 text-sm">
                <input
                  type="checkbox"
                  checked={showLease}
                  onChange={(e) => setShowLease(e.target.checked)}
                  disabled={loading || noCredentials || buynowNum <= 0}
                  className="mt-0.5 h-4 w-4 rounded border-border"
                />
                <span>
                  Lease to Own
                  {buynowNum <= 0 && (
                    <span className="block text-[11px] text-accent-warning">
                      Needs a Buy Now price
                    </span>
                  )}
                </span>
              </label>

              {showLease && (
                <div className="space-y-2 pl-6">
                  <div className="flex items-end gap-3">
                    <div className="w-28">
                      <Label htmlFor="afternic-payments">Payments</Label>
                      <Input
                        id="afternic-payments"
                        type="number"
                        min={2}
                        max={60}
                        value={maxLeasePeriod}
                        onChange={(e) => setMaxLeasePeriod(e.target.value)}
                        disabled={loading || noCredentials}
                        className="mt-1"
                      />
                    </div>
                    {monthlyEstimate && (
                      <p className="pb-2 text-xs text-text-muted">
                        ≈ $
                        {monthlyEstimate.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        / month
                      </p>
                    )}
                  </div>
                </div>
              )}

              {!showBuynow && !showMakeOffer && !showLease && (
                <p className="text-xs text-accent-danger">Choose at least one sales method</p>
              )}
            </div>
          )}

          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex items-center gap-1.5 text-sm font-medium text-text-muted transition-colors hover:text-text-primary"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
              />
              Advanced
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-4 rounded-xl border border-border p-4">
                <div>
                  <Label htmlFor="afternic-floor">Floor Price (optional)</Label>
                  <Input
                    id="afternic-floor"
                    type="number"
                    step="1"
                    min="0"
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    placeholder="0"
                    disabled={loading || noCredentials}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="afternic-display">Display Name (optional)</Label>
                  <Input
                    id="afternic-display"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={domain.domain}
                    disabled={loading || noCredentials}
                    className="mt-1"
                  />
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-text-muted">
                  <input
                    type="checkbox"
                    checked={hidden}
                    onChange={(e) => setHidden(e.target.checked)}
                    disabled={loading || noCredentials}
                    className="h-4 w-4 rounded border-border"
                  />
                  Hide from marketplace
                </label>
              </div>
            )}
          </div>

          {error && (
            <p className="rounded-md border border-accent-danger/20 bg-accent-danger/5 p-3 text-sm text-accent-danger">
              {error}
            </p>
          )}

          {showRemoveConfirm && (
            <div className="rounded-md border border-accent-danger/30 bg-accent-danger/5 p-3">
              <p className="mb-2 text-sm font-medium">Remove from Afternic?</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemove}
                  disabled={loading}
                  className="border-accent-danger/30 text-accent-danger hover:bg-accent-danger/10"
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

        <div className="flex items-center justify-between border-t border-border p-6">
          {isEdit ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRemoveConfirm(true)}
              disabled={loading || showRemoveConfirm}
              className="text-accent-danger hover:bg-accent-danger/10"
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Remove from Afternic
            </Button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            {noCredentials ? (
              <Button disabled title="Add Afternic credentials in Settings first">
                {isEdit ? "Update" : "List on Afternic"}
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Processing...
                  </span>
                ) : isEdit ? (
                  "Update"
                ) : (
                  "List on Afternic"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
