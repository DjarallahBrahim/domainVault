"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { queryKeys } from "@/lib/query-keys";
import {
  fetchListedPlatforms,
  removeDomainFromPlatforms,
  type RemovableDomain,
  type RemovablePlatform,
} from "@/lib/platforms/registry";

interface RemoveFromPlatformsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domain: RemovableDomain | null;
  platforms: RemovablePlatform[];
}

export function RemoveFromPlatformsDialog({
  open,
  onOpenChange,
  domain,
  platforms,
}: RemoveFromPlatformsDialogProps) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSelected(platforms.map((p) => p.id));
      setError(null);
    }
  }, [open, platforms]);

  function toggle(id: string, checked: boolean) {
    setSelected((prev) =>
      checked ? [...prev, id] : prev.filter((value) => value !== id)
    );
  }

  async function handleRemove() {
    if (!domain) return;

    const chosen = platforms.filter((p) => selected.includes(p.id));
    if (chosen.length === 0) {
      onOpenChange(false);
      return;
    }

    setRemoving(true);
    setError(null);

    const outcomes = await removeDomainFromPlatforms(chosen, domain);
    const succeeded = outcomes.filter((o) => o.ok);
    const failed = outcomes.filter((o) => !o.ok);

    if (succeeded.length > 0) {
      queryClient.invalidateQueries({ queryKey: queryKeys.domains.all });
      for (const outcome of succeeded) {
        queryClient.invalidateQueries({ queryKey: outcome.platform.queryKey });
      }
      toast.success(
        `Removed from ${succeeded.map((o) => o.platform.label).join(", ")}`
      );
    }

    if (failed.length > 0) {
      setError(
        failed
          .map((o) => `${o.platform.label}: ${o.error ?? "failed"}`)
          .join(" · ")
      );
      toast.error("Couldn't remove from every platform");
    } else {
      onOpenChange(false);
    }

    setRemoving(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!removing) onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Remove {domain?.domain} from your marketplaces?
          </DialogTitle>
          <DialogDescription>
            This domain is still listed for sale. Delisting it keeps buyers from
            trying to purchase something you no longer own.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {platforms.map((platform) => (
            <label
              key={platform.id}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 text-sm"
            >
              <Checkbox
                checked={selected.includes(platform.id)}
                onCheckedChange={(checked) => toggle(platform.id, checked === true)}
                disabled={removing}
              />
              <span className="font-medium">{platform.label}</span>
            </label>
          ))}
        </div>

        {error && (
          <p className="rounded-md border border-accent-danger/20 bg-accent-danger/5 p-3 text-sm text-accent-danger">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={removing}
          >
            Keep listed
          </Button>
          <Button
            onClick={handleRemove}
            disabled={removing || selected.length === 0}
          >
            {removing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Removing…
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Remove from {selected.length} platform
                {selected.length === 1 ? "" : "s"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface RemoveFromPlatformsPromptProps {
  domain: RemovableDomain | null;
  onClose: () => void;
}

/**
 * Given a domain that just sold, checks which marketplaces still list it and,
 * only if there are any, opens the removal dialog.
 */
export function RemoveFromPlatformsPrompt({
  domain,
  onClose,
}: RemoveFromPlatformsPromptProps) {
  const [platforms, setPlatforms] = useState<RemovablePlatform[] | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!domain) {
      setPlatforms(null);
      return;
    }

    let cancelled = false;
    fetchListedPlatforms(domain.id)
      .then((list) => {
        if (cancelled) return;
        if (list.length > 0) setPlatforms(list);
        else onCloseRef.current();
      })
      .catch(() => {
        if (!cancelled) onCloseRef.current();
      });

    return () => {
      cancelled = true;
    };
  }, [domain]);

  return (
    <RemoveFromPlatformsDialog
      open={platforms !== null}
      onOpenChange={(open) => {
        if (!open) {
          setPlatforms(null);
          onClose();
        }
      }}
      domain={domain}
      platforms={platforms ?? []}
    />
  );
}
