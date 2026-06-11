"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSpaceshipSync } from "@/lib/hooks/useSpaceshipSync";

export function SpaceshipSyncButton() {
  const { sync, isSyncing, lastSyncedAt, error } = useSpaceshipSync();

  async function handleSync() {
    try {
      await sync();
      toast.success("Spaceship listings synced");
    } catch (err) {
      toast.error(error ?? (err instanceof Error ? err.message : "Sync failed"));
    }
  }

  const timeAgo = lastSyncedAt
    ? (() => {
        const diff = Math.floor((Date.now() - lastSyncedAt.getTime()) / 60000);
        if (diff < 1) return "just now";
        if (diff === 1) return "1 min ago";
        return `${diff} min ago`;
      })()
    : null;

  return (
    <div className="flex flex-col items-end gap-0.5">
      <Button
        variant="outline"
        size="sm"
        onClick={handleSync}
        disabled={isSyncing}
      >
        <RefreshCw className={`h-4 w-4 mr-1.5 ${isSyncing ? "animate-spin" : ""}`} />
        {isSyncing ? "Syncing..." : "Sync Spaceship"}
      </Button>
      {timeAgo && (
        <span className="text-xs text-text-muted">Last synced: {timeAgo}</span>
      )}
    </div>
  );
}
