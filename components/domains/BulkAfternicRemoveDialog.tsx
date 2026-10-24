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
import { deleteAfternicListing } from "@/lib/supabase/queries/afternic-listings-client";

export interface RemoveCandidate {
  id: string;
  domain: string;
}

interface BulkAfternicRemoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidates: RemoveCandidate[];
  onComplete: () => void;
}

export function BulkAfternicRemoveDialog({
  open,
  onOpenChange,
  candidates,
  onComplete,
}: BulkAfternicRemoveDialogProps) {
  const queryClient = useQueryClient();
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Array<{
    domain: string;
    ok: boolean;
    message?: string;
  }> | null>(null);

  async function handleRemove() {
    if (candidates.length === 0) return;
    setRunning(true);

    try {
      const response = await fetch("/api/afternic/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domains: candidates.map((c) => c.domain) }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok || body.error) {
        throw new Error(body.error ?? "Bulk removal failed");
      }

      const succeeded = (body.data?.succeeded ?? []) as string[];
      const failed = (body.data?.failed ?? []) as Array<{
        domain: string;
        message: string;
      }>;

      const idByDomain = new Map(
        candidates.map((candidate) => [candidate.domain.toLowerCase(), candidate.id])
      );

      for (const domain of succeeded) {
        const domainId = idByDomain.get(domain.toLowerCase());
        if (domainId) await deleteAfternicListing(domainId);
      }

      setResults([
        ...succeeded.map((domain) => ({ domain, ok: true })),
        ...failed.map((item) => ({
          domain: item.domain,
          ok: false,
          message: item.message,
        })),
      ]);

      queryClient.invalidateQueries({ queryKey: queryKeys.afternicListings.all });
      toast.success(
        `${succeeded.length} domain${succeeded.length === 1 ? "" : "s"} removed from Afternic`
      );
      if (failed.length === 0) onComplete();
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
            Remove {candidates.length} domain
            {candidates.length === 1 ? "" : "s"} from Afternic?
          </DialogTitle>
          <DialogDescription>
            This only removes the Afternic listing. Your DomainVault records and domain
            registrations are not affected.
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
                        <span className="text-accent-danger">✗ {row.message ?? "Failed"}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="max-h-48 overflow-y-auto rounded-lg border border-border p-2 font-mono text-xs text-text-muted">
            {candidates.map((candidate) => (
              <div key={candidate.id} className="px-1 py-0.5">
                {candidate.domain}
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={running}>
            {results ? "Close" : "Cancel"}
          </Button>
          {!results && (
            <Button
              variant="outline"
              onClick={handleRemove}
              disabled={running}
              className="border-accent-danger/30 text-accent-danger hover:bg-accent-danger/10"
            >
              {running ? "Removing..." : "Remove from Afternic"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
