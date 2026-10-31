"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Globe, Loader2, X } from "lucide-react";
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
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-keys";
import { upsertAtomListing } from "@/lib/supabase/queries/atom-listings-client";
import { analyzeDomain } from "@/lib/whois";
import type { AtomUnmatchedDomain } from "@/lib/hooks/useAtomSync";

interface ImportUnmatchedAtomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domains: AtomUnmatchedDomain[];
  onImported: () => void;
}

type WhoisStatus = "loading" | "ok" | "unregistered" | "error";

interface WhoisRow {
  status: WhoisStatus;
  expirationDate: string | null;
  registrar: string | null;
  registrarRaw: string | null;
  error?: string;
}

const WHOIS_CONCURRENCY = 3;

export function ImportUnmatchedAtomDialog({
  open,
  onOpenChange,
  domains,
  onImported,
}: ImportUnmatchedAtomDialogProps) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expirationDate, setExpirationDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [whoisByDomain, setWhoisByDomain] = useState<Record<string, WhoisRow>>({});
  const [whoisLoading, setWhoisLoading] = useState(false);
  const [whoisProgress, setWhoisProgress] = useState({ done: 0, total: 0 });
  const whoisRun = useRef(0);

  useEffect(() => {
    if (!open) return;
    whoisRun.current += 1;
    setSelected(new Set(domains.map((item) => item.domain)));
    setExpirationDate("");
    setWhoisByDomain({});
    setWhoisLoading(false);
    setWhoisProgress({ done: 0, total: 0 });
  }, [open, domains]);

  function toggle(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      // Invalidate any in-flight WHOIS run so it cannot update a closed dialog.
      whoisRun.current += 1;
      setWhoisLoading(false);
    }
    onOpenChange(next);
  }

  async function fetchWhois() {
    const targets = domains.filter((item) => selected.has(item.domain));
    if (targets.length === 0) return;

    const runId = ++whoisRun.current;
    setWhoisLoading(true);
    setWhoisProgress({ done: 0, total: targets.length });
    setWhoisByDomain((prev) => {
      const next = { ...prev };
      for (const item of targets) {
        next[item.domain] = {
          status: "loading",
          expirationDate: null,
          registrar: null,
          registrarRaw: null,
        };
      }
      return next;
    });

    let cursor = 0;
    let done = 0;
    const outcome = { dates: 0, registrars: 0, noDate: 0, unregistered: 0, failed: 0 };

    const worker = async () => {
      while (true) {
        const index = cursor;
        cursor += 1;
        if (index >= targets.length) return;

        const item = targets[index];
        try {
          const result = await analyzeDomain(item.domain);
          if (whoisRun.current !== runId) return;

          const canonical = result.registrar.value?.trim().toLowerCase();
          const raw = result.registrar.raw?.trim().toLowerCase();
          const registrar = canonical || raw || null;

          setWhoisByDomain((prev) => ({
            ...prev,
            [item.domain]: {
              status: result.registered ? "ok" : "unregistered",
              expirationDate: result.expirationDate,
              registrar,
              registrarRaw: result.registrar.raw,
            },
          }));

          if (result.registered) {
            if (result.expirationDate) outcome.dates += 1;
            else outcome.noDate += 1;
            if (registrar) outcome.registrars += 1;
          } else {
            outcome.unregistered += 1;
          }
        } catch (err) {
          if (whoisRun.current !== runId) return;
          outcome.failed += 1;
          setWhoisByDomain((prev) => ({
            ...prev,
            [item.domain]: {
              status: "error",
              expirationDate: null,
              registrar: null,
              registrarRaw: null,
              error: err instanceof Error ? err.message : "WHOIS lookup failed",
            },
          }));
        } finally {
          if (whoisRun.current === runId) {
            done += 1;
            setWhoisProgress({ done, total: targets.length });
          }
        }
      }
    };

    await Promise.all(Array.from({ length: WHOIS_CONCURRENCY }, () => worker()));
    if (whoisRun.current !== runId) return;

    setWhoisLoading(false);

    if (outcome.failed > 0) {
      toast.warning(
        `WHOIS finished · ${outcome.dates} date${outcome.dates === 1 ? "" : "s"}, ${
          outcome.registrars
        } registrar${outcome.registrars === 1 ? "" : "s"}${
          outcome.failed ? `, ${outcome.failed} failed` : ""
        }${outcome.unregistered ? `, ${outcome.unregistered} unregistered` : ""}`
      );
    } else if (outcome.dates > 0 || outcome.registrars > 0) {
      toast.success(
        `WHOIS filled ${outcome.dates} date${outcome.dates === 1 ? "" : "s"} and ${
          outcome.registrars
        } registrar${outcome.registrars === 1 ? "" : "s"}${
          outcome.noDate ? ` · ${outcome.noDate} without a date` : ""
        }`
      );
    } else {
      toast.warning("WHOIS did not return any expiration dates or registrars");
    }
  }

  async function handleImport() {
    if (selected.size === 0) return;

    const chosen = domains.filter((item) => selected.has(item.domain));
    const missing = chosen.filter((item) => {
      const whois = whoisByDomain[item.domain];
      return !whois?.expirationDate && !expirationDate;
    });

    if (missing.length > 0) {
      toast.error(
        `Add a fallback expiration date or fetch it via WHOIS for ${missing.length} domain${
          missing.length === 1 ? "" : "s"
        }`
      );
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const rows = chosen.map((item) => {
        const whois = whoisByDomain[item.domain];
        return {
          user_id: user.id,
          domain: item.domain,
          expiration_date: whois?.expirationDate || expirationDate,
          purchase_price: null,
          bin: item.payload.selling_price,
          registrar: whois?.registrar ?? null,
          notes: null,
          tags: null,
          status: "active" as const,
        };
      });

      const { data: inserted, error } = await supabase
        .from("domains")
        .upsert(rows as never, {
          onConflict: "user_id,domain",
          ignoreDuplicates: true,
        })
        .select("id, domain");

      if (error) throw error;

      const idByDomain = new Map(
        ((inserted ?? []) as unknown as Array<{ id: string; domain: string }>).map((row) => [
          row.domain.toLowerCase(),
          row.id,
        ])
      );

      let linked = 0;
      for (const item of chosen) {
        const domainId = idByDomain.get(item.domain.toLowerCase());
        if (!domainId) continue;
        await upsertAtomListing({ ...item.payload, domain_id: domainId });
        linked += 1;
      }

      const skipped = chosen.length - linked;

      await supabase.from("import_logs").insert({
        user_id: user.id,
        filename: "Atom",
        total_rows: chosen.length,
        imported: linked,
        skipped,
        errors: { source: "atom", whois: Object.keys(whoisByDomain).length > 0 },
      } as never);

      queryClient.invalidateQueries({ queryKey: queryKeys.domains.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.atomListings.all });

      toast.success(`${linked} domain${linked === 1 ? "" : "s"} added to DomainVault`);
      onImported();
      handleOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not import Atom domains");
    } finally {
      setSaving(false);
    }
  }

  function expirationCell(item: AtomUnmatchedDomain) {
    const whois = whoisByDomain[item.domain];

    if (whois?.status === "loading") {
      return <Loader2 className="h-3.5 w-3.5 animate-spin text-text-muted" />;
    }
    if (whois?.status === "unregistered") {
      return (
        <span className="text-accent-warning">
          Not registered
          {expirationDate ? (
            <span className="block text-text-muted">Using {expirationDate}</span>
          ) : null}
        </span>
      );
    }
    if (whois?.status === "error") {
      return (
        <span className="text-accent-danger" title={whois.error}>
          WHOIS failed
          {expirationDate ? (
            <span className="block text-text-muted">Using {expirationDate}</span>
          ) : null}
        </span>
      );
    }
    if (whois?.expirationDate) {
      return <span className="font-mono">{whois.expirationDate}</span>;
    }
    if (expirationDate) {
      return <span className="text-text-muted">{expirationDate} (fallback)</span>;
    }
    return <span className="text-accent-warning">Missing</span>;
  }

  function registrarCell(item: AtomUnmatchedDomain) {
    const whois = whoisByDomain[item.domain];

    if (whois?.status === "loading") {
      return <Loader2 className="h-3.5 w-3.5 animate-spin text-text-muted" />;
    }
    if (whois?.registrar) {
      return <span title={whois.registrarRaw ?? whois.registrar}>{whois.registrar}</span>;
    }
    if (whois?.status === "error") {
      return (
        <span className="text-accent-danger" title={whois.error}>
          —
        </span>
      );
    }
    return <span className="text-text-muted">—</span>;
  }

  const hasWhois = Object.keys(whoisByDomain).length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Atom domains not in DomainVault</DialogTitle>
          <DialogDescription>
            These domains are listed on Atom but missing from your portfolio. Atom does not return
            expiration dates or registrars — fetch them via WHOIS, or set a fallback date.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="atom-import-expiry">Fallback expiration date</Label>
              <Input
                id="atom-import-expiry"
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="w-48"
              />
              <p className="text-xs text-text-muted">
                Used only for domains where WHOIS has no expiration date.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fetchWhois}
              disabled={whoisLoading || saving || selected.size === 0}
            >
              {whoisLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Globe className="mr-2 h-4 w-4" />
              )}
              {whoisLoading
                ? `Fetching ${whoisProgress.done}/${whoisProgress.total}…`
                : `Fetch via WHOIS (${selected.size})`}
            </Button>

            {hasWhois && !whoisLoading && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setWhoisByDomain({})}
                disabled={saving}
              >
                <X className="mr-2 h-4 w-4" />
                Clear WHOIS
              </Button>
            )}
          </div>

          <div className="max-h-72 overflow-auto rounded-lg border border-border">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="sticky top-0 bg-bg-elevated text-xs text-text-muted">
                <tr>
                  <th className="w-10 px-3 py-2" />
                  <th className="px-3 py-2 text-left">Domain</th>
                  <th className="px-3 py-2 text-right">Price</th>
                  <th className="px-3 py-2 text-left">Expiration</th>
                  <th className="px-3 py-2 text-left">Registrar</th>
                  <th className="px-3 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {domains.map((item) => (
                  <tr key={item.domain} className="border-t border-border/50">
                    <td className="px-3 py-1.5">
                      <input
                        type="checkbox"
                        checked={selected.has(item.domain)}
                        onChange={() => toggle(item.domain)}
                        className="h-4 w-4 rounded border-border"
                      />
                    </td>
                    <td className="px-3 py-1.5 font-mono text-xs">{item.domain}</td>
                    <td className="px-3 py-1.5 text-right font-mono text-xs">
                      {item.payload.selling_price
                        ? `$${Math.round(item.payload.selling_price).toLocaleString("en-US")}`
                        : "—"}
                    </td>
                    <td className="px-3 py-1.5 text-xs">{expirationCell(item)}</td>
                    <td className="px-3 py-1.5 text-xs">{registrarCell(item)}</td>
                    <td className="px-3 py-1.5 text-xs text-text-muted">
                      {item.payload.list_status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={saving || whoisLoading || selected.size === 0}>
            {saving ? "Adding..." : `Add ${selected.size} domains`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
