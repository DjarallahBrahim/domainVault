"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { addYears, format, parseISO } from "date-fns";
import { AlertCircle, CalendarClock, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
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
import { queryKeys } from "@/lib/query-keys";
import { analyzeDomain } from "@/lib/whois";
import { recordDomainRenewal } from "@/lib/supabase/queries/renewals-client";
import type { RenewalTarget } from "@/types/renewal";

const DEFAULT_RENEWAL_COST = "10.44";
const WHOIS_CONCURRENCY = 3;

type RowStatus = "loading" | "ready" | "error";

interface RenewalRowState {
  id: string;
  domain: string;
  currentExpiration: string;
  newExpiration: string;
  whoisExpiration: string | null;
  status: RowStatus;
  error: string | null;
}

interface RenewDomainsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targets: RenewalTarget[];
  /** Called after a successful renewal, with the persisted new date. */
  onRenewed?: (domainId: string, newExpirationDate: string) => void;
}

function suggestRenewalDate(expiration: string): string {
  const parsed = parseISO(expiration);
  if (Number.isNaN(parsed.getTime())) return "";
  return format(addYears(parsed, 1), "yyyy-MM-dd");
}

/**
 * Uses the WHOIS date only when it actually moves the expiration forward.
 * Registries can lag behind a fresh renewal, in which case the suggested
 * +1 year date is the safer default (the user can still edit it).
 */
function resolveRenewalDate(
  whoisDate: string | null,
  currentExpiration: string,
  fallback: string
): string {
  if (!whoisDate) return fallback;

  const whois = parseISO(whoisDate);
  if (Number.isNaN(whois.getTime())) return fallback;

  const current = parseISO(currentExpiration);
  if (!Number.isNaN(current.getTime()) && whois.getTime() <= current.getTime()) {
    return fallback;
  }

  return whoisDate;
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function RenewDomainsDialog({
  open,
  onOpenChange,
  targets,
  onRenewed,
}: RenewDomainsDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [cost, setCost] = useState(DEFAULT_RENEWAL_COST);
  const [rows, setRows] = useState<RenewalRowState[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Keep the latest targets in a ref so the WHOIS effect only reruns when the
  // dialog opens or the selection actually changes (not on every parent render).
  const targetsRef = useRef(targets);
  targetsRef.current = targets;
  const targetKey = targets.map((target) => target.id).join(",");

  useEffect(() => {
    if (!open) return;

    const list = targetsRef.current;
    setCost(DEFAULT_RENEWAL_COST);
    setIsSubmitting(false);
    setRows(
      list.map((target) => ({
        id: target.id,
        domain: target.domain,
        currentExpiration: target.expiration_date,
        newExpiration: suggestRenewalDate(target.expiration_date),
        whoisExpiration: null,
        status: "loading",
        error: null,
      }))
    );

    if (list.length === 0) return;

    let cancelled = false;
    let cursor = 0;

    const worker = async () => {
      while (!cancelled) {
        const index = cursor;
        cursor += 1;
        if (index >= list.length) return;

        const target = list[index];
        try {
          const result = await analyzeDomain(target.domain);
          if (cancelled) return;
          setRows((prev) =>
            prev.map((row, i) =>
              i === index
                ? {
                    ...row,
                    status: "ready",
                    whoisExpiration: result.expirationDate,
                    newExpiration: resolveRenewalDate(
                      result.expirationDate,
                      target.expiration_date,
                      row.newExpiration
                    ),
                  }
                : row
            )
          );
        } catch {
          if (cancelled) return;
          setRows((prev) =>
            prev.map((row, i) =>
              i === index
                ? {
                    ...row,
                    status: "error",
                    error: "WHOIS unavailable — suggested date kept",
                  }
                : row
            )
          );
        }
      }
    };

    void Promise.all(Array.from({ length: WHOIS_CONCURRENCY }, () => worker()));

    return () => {
      cancelled = true;
    };
  }, [open, targetKey]);

  const costValue = Number(cost);
  const isCostValid = Number.isFinite(costValue) && costValue >= 0;
  const totalCost = isCostValid ? costValue * rows.length : 0;
  const datesComplete = rows.length > 0 && rows.every((row) => !!row.newExpiration);
  const loadingCount = useMemo(() => rows.filter((row) => row.status === "loading").length, [rows]);
  const canSubmit = !isSubmitting && datesComplete && isCostValid && loadingCount === 0;
  const isBulk = rows.length > 1;

  const updateRowDate = (id: string, value: string) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, newExpiration: value } : row)));
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);

    try {
      const results = await Promise.allSettled(
        rows.map((row) =>
          recordDomainRenewal({
            domainId: row.id,
            newExpirationDate: row.newExpiration,
            cost: costValue,
          })
        )
      );

      const succeeded = results.flatMap((result, index) =>
        result.status === "fulfilled" ? [{ row: rows[index], result: result.value }] : []
      );
      const failed = results.filter((result) => result.status === "rejected");

      if (succeeded.length === 0) {
        const firstError = failed[0];
        const message =
          firstError && firstError.status === "rejected" && firstError.reason instanceof Error
            ? firstError.reason.message
            : "Could not record the renewal";
        toast.error("Renewal failed", { description: message });
        return;
      }

      for (const entry of succeeded) {
        onRenewed?.(entry.row.id, entry.row.newExpiration);
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.domains.all });
      router.refresh();

      toast.success(
        isBulk
          ? `${succeeded.length} domain${succeeded.length === 1 ? "" : "s"} renewed`
          : "Domain renewed",
        {
          description: `${formatMoney(costValue * succeeded.length)} added to ${
            isBulk ? "their costs" : "the domain cost"
          }.`,
        }
      );

      if (failed.length > 0) {
        toast.warning(`${failed.length} renewal${failed.length === 1 ? "" : "s"} failed`, {
          description: "Those domains were left unchanged.",
        });
      }

      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={isBulk ? "sm:max-w-2xl" : undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-accent-primary" />
            {isBulk ? `Renew ${rows.length} domains` : "Renew domain"}
          </DialogTitle>
          <DialogDescription>
            The expiration date is fetched from WHOIS. Confirm the cost — it is added to the
            domain&apos;s total cost and logged in its renewal history.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-bg-elevated/50 p-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="renewal-cost">
                  {isBulk ? "Renewal cost per domain ($)" : "Renewal cost ($)"}
                </Label>
                <Input
                  id="renewal-cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={cost}
                  onChange={(event) => setCost(event.target.value)}
                  className="w-36"
                />
              </div>
              <div className="text-right">
                <p className="text-xs text-text-muted">Total to add</p>
                <p className="text-lg font-semibold tabular-nums">{formatMoney(totalCost)}</p>
              </div>
            </div>
          </div>

          <div className="max-h-[45vh] space-y-2 overflow-y-auto pr-1">
            {rows.map((row) => (
              <div key={row.id} className="rounded-lg border border-border/70 bg-bg-surface p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm font-medium">{row.domain}</p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      Current expiration {row.currentExpiration || "—"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {row.status === "loading" && (
                      <span className="flex items-center gap-1 text-xs text-text-muted">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        WHOIS…
                      </span>
                    )}
                    {row.status === "ready" && (
                      <span className="flex items-center gap-1 text-xs text-accent-success">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {row.whoisExpiration && row.whoisExpiration === row.newExpiration
                          ? "WHOIS date"
                          : "Suggested date — adjust if needed"}
                      </span>
                    )}
                    {row.status === "error" && (
                      <span className="flex items-center gap-1 text-xs text-accent-warning">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Suggested date
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap items-end gap-3">
                  <div className="space-y-1">
                    <Label htmlFor={`renewal-date-${row.id}`} className="text-xs text-text-muted">
                      New expiration date
                    </Label>
                    <Input
                      id={`renewal-date-${row.id}`}
                      type="date"
                      value={row.newExpiration}
                      onChange={(event) => updateRowDate(row.id, event.target.value)}
                      className="w-44"
                    />
                  </div>
                  {row.error && <p className="text-xs text-accent-warning">{row.error}</p>}
                </div>
              </div>
            ))}
          </div>

          {loadingCount > 0 && (
            <p className="flex items-center gap-1.5 text-xs text-text-muted">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Fetching WHOIS expiration date{loadingCount > 1 ? "s" : ""} ({loadingCount} left)…
            </p>
          )}
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="rounded-md bg-bg-elevated px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-elevated/80 disabled:opacity-50"
          >
            Cancel
          </button>
          <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {isSubmitting
              ? "Recording…"
              : isBulk
                ? `Renew ${rows.length} domains`
                : "Confirm renewal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
