"use client";

import { useEffect, useState } from "react";
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
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-keys";
import { upsertAfternicListing } from "@/lib/supabase/queries/afternic-listings-client";
import type { AfternicUnmatchedDomain } from "@/lib/hooks/useAfternicSync";

interface ImportUnmatchedAfternicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domains: AfternicUnmatchedDomain[];
  onImported: () => void;
}

export function ImportUnmatchedAfternicDialog({
  open,
  onOpenChange,
  domains,
  onImported,
}: ImportUnmatchedAfternicDialogProps) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expirationDate, setExpirationDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelected(new Set(domains.map((item) => item.domain)));
    setExpirationDate("");
  }, [open, domains]);

  function toggle(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  async function handleImport() {
    if (!expirationDate) {
      toast.error("Choose an expiration date for the imported domains");
      return;
    }
    if (selected.size === 0) return;

    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const chosen = domains.filter((item) => selected.has(item.domain));

      const rows = chosen.map((item) => ({
        user_id: user.id,
        domain: item.domain,
        expiration_date: expirationDate,
        purchase_price: null,
        bin: item.payload.buynow_price,
        registrar: item.payload.afternic_registrar
          ? item.payload.afternic_registrar.trim().toLowerCase()
          : null,
        notes: null,
        tags: null,
        status: "active" as const,
      }));

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
        await upsertAfternicListing({ ...item.payload, domain_id: domainId });
        linked += 1;
      }

      const skipped = chosen.length - linked;

      await supabase.from("import_logs").insert({
        user_id: user.id,
        filename: "Afternic",
        total_rows: chosen.length,
        imported: linked,
        skipped,
        errors: { source: "afternic" },
      } as never);

      queryClient.invalidateQueries({ queryKey: queryKeys.domains.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.afternicListings.all });

      toast.success(`${linked} domain${linked === 1 ? "" : "s"} added to DomainVault`);
      onImported();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not import Afternic domains");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Afternic domains not in DomainVault</DialogTitle>
          <DialogDescription>
            These domains are listed on Afternic but missing from your portfolio. Choose which ones
            to add. Afternic does not return expiration dates, so pick one below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="afternic-import-expiry">Expiration date *</Label>
            <Input
              id="afternic-import-expiry"
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              className="w-48"
            />
          </div>

          <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-bg-elevated text-xs text-text-muted">
                <tr>
                  <th className="w-10 px-3 py-2" />
                  <th className="px-3 py-2 text-left">Domain</th>
                  <th className="px-3 py-2 text-right">Price</th>
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
                      {item.payload.buynow_price
                        ? `$${item.payload.buynow_price.toLocaleString("en-US")}`
                        : "—"}
                    </td>
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={saving || selected.size === 0}>
            {saving ? "Adding..." : `Add ${selected.size} domains`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
