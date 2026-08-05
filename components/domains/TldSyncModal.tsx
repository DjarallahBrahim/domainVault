"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TldSyncButton } from "./TldSyncButton";

interface TldSyncModalProps {
  totalDomains: number;
  currentPageDomainIds: string[];
  domains: Array<{ id: string; domain: string }>;
  userId: string;
}

export function TldSyncModal({
  totalDomains,
  currentPageDomainIds,
  domains,
  userId,
}: TldSyncModalProps) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<"all" | "page">("all");
  const [confirmed, setConfirmed] = useState(false);

  const pageCount = currentPageDomainIds.length;
  const canConfirm = scope === "all" || pageCount > 0;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setConfirmed(false);
          setOpen(true);
        }}
        className="font-mono text-xs"
        disabled={confirmed}
      >
        Sync TLDs
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm">
              Sync TLD Reservations
            </DialogTitle>
          </DialogHeader>

          {!confirmed ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground font-mono">
                Choose which domains to check for TLD reservations:
              </p>

              <div className="space-y-2">
                <label
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    scope === "all"
                      ? "border-accent-primary bg-accent-primary/5"
                      : "border-border hover:bg-bg-elevated"
                  }`}
                >
                  <input
                    type="radio"
                    name="scope"
                    value="all"
                    checked={scope === "all"}
                    onChange={() => setScope("all")}
                    className="accent-accent-primary"
                  />
                  <div>
                    <div className="text-sm font-medium font-mono">
                      All domains
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {totalDomains} domains
                    </div>
                  </div>
                </label>

                <label
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    scope === "page"
                      ? "border-accent-primary bg-accent-primary/5"
                      : "border-border hover:bg-bg-elevated"
                  }`}
                >
                  <input
                    type="radio"
                    name="scope"
                    value="page"
                    checked={scope === "page"}
                    onChange={() => setScope("page")}
                    className="accent-accent-primary"
                  />
                  <div>
                    <div className="text-sm font-medium font-mono">
                      Current page
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {pageCount > 0
                        ? `${pageCount} domains`
                        : "No domains on this page"}
                    </div>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                  className="font-mono text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => setConfirmed(true)}
                  disabled={!canConfirm}
                  className="font-mono text-xs"
                >
                  Start Sync
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-4">
              <p className="text-sm text-muted-foreground font-mono mb-4">
                Sync in progress...
              </p>
              <TldSyncButton
                variant="full"
                scope={scope}
                domainIds={scope === "page" ? currentPageDomainIds : []}
                domains={domains}
                userId={userId}
              />
              <div className="mt-3 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setOpen(false);
                    setConfirmed(false);
                  }}
                  className="font-mono text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
