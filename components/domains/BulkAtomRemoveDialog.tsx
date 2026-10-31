"use client";

import { useState } from "react";
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
import { queryKeys } from "@/lib/query-keys";
import { isAtomRemovable } from "@/lib/atom/pricing";
import { deleteAtomListing } from "@/lib/supabase/queries/atom-listings-client";
import type { AtomListing } from "@/types/atom";

export interface BulkAtomRemoveCandidate {
  id: string;
  domain: string;
  listing: AtomListing;
}

interface BulkAtomRemoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidates: BulkAtomRemoveCandidate[];
  onComplete: () => void;
}

interface ResultRow {
  domain: string;
  ok: boolean;
  message?: string;
}

export function BulkAtomRemoveDialog({
  open,
  onOpenChange,
  candidates,
  onComplete,
}: BulkAtomRemoveDialogProps) {
  const queryClient = useQueryClient();
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<ResultRow[] | null>(null);

  const removable = candidates.filter((candidate) =>
    isAtomRemovable(candidate.listing.listing_type)
  );
  const blocked = candidates.filter(
    (candidate) => !isAtomRemovable(candidate.listing.listing_type)
  );

  async function handleRemove() {
    if (removable.length === 0) return;
    setRunning(true);

    try {
      const response = await fetch("/api/atom/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: removable.map((candidate) => ({
            domain: candidate.domain,
            listingType: candidate.listing.listing_type,
          })),
        }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok || body.error) {
        throw new Error(body.error ?? "Bulk removal failed");
      }

      const succeeded = (body.data?.succeeded ?? []) as Array<{ domain: string }>;
      const failed = (body.data?.failed ?? []) as Array<{
        domain: string;
        message: string;
      }>;

      const idByDomain = new Map(
        removable.map((candidate) => [candidate.domain.toLowerCase(), candidate.id])
      );

      for (const item of succeeded) {
        const domainId = idByDomain.get(item.domain.toLowerCase());
        if (domainId) await deleteAtomListing(domainId);
      }

      setResults([
        ...succeeded.map((item) => ({ domain: item.domain, ok: true })),
        ...failed.map((item) => ({
          domain: item.domain,
          ok: false,
          message: item.message,
        })),
        ...blocked.map((candidate) => ({
          domain: candidate.domain,
          ok: false,
          message: `${candidate.listing.listing_type} listings can only be removed from the Atom dashboard`,
        })),
      ]);

      queryClient.invalidateQueries({ queryKey: queryKeys.atomListings.all });
      toast.success(
        `${succeeded.length} domain${succeeded.length === 1 ? "" : "s"} removed from Atom`
      );
      if (failed.length === 0 && blocked.length === 0) onComplete();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bulk removal failed");
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
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Remove {removable.length} domain{removable.length === 1 ? "" : "s"} from Atom?
          </DialogTitle>
          <DialogDescription>
            Only Standard and Plus listings can be removed through the API. Premium and Geo listings
            stay on Atom and must be removed from its dashboard.
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
                        <span className="text-accent-success">✓ Removed</span>
                      ) : (
                        <span className="text-accent-danger">✗ {row.message ?? "Skipped"}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-border p-2 font-mono text-xs text-text-muted">
              {removable.map((candidate) => (
                <div key={candidate.id} className="flex justify-between gap-3 px-1 py-0.5">
                  <span>{candidate.domain}</span>
                  <span className="text-text-muted/60">{candidate.listing.listing_type}</span>
                </div>
              ))}
              {removable.length === 0 && (
                <p className="p-2 font-sans text-accent-warning">
                  None of the selected domains are Standard or Plus Atom listings.
                </p>
              )}
            </div>

            {blocked.length > 0 && (
              <p className="text-xs text-accent-warning">
                {blocked.length} Premium/Geo listing{blocked.length === 1 ? "" : "s"} will be
                skipped.
              </p>
            )}
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={running}>
            {results ? "Close" : "Cancel"}
          </Button>
          {!results && (
            <Button
              variant="outline"
              onClick={handleRemove}
              disabled={running || removable.length === 0}
              className="border-accent-danger/30 text-accent-danger hover:bg-accent-danger/10"
            >
              {running ? "Removing..." : "Remove from Atom"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
