"use client";

import { useState } from "react";
import { RefreshCw, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useSedoSync } from "@/lib/hooks/useSedoSync";
import { useSpaceshipSync } from "@/lib/hooks/useSpaceshipSync";
import { TldSyncModal } from "./TldSyncModal";

interface SyncMenuProps {
  totalDomains: number;
  currentPageDomainIds: string[];
  domains: Array<{ id: string; domain: string }>;
  userId: string;
}

export function SyncMenu({
  totalDomains,
  currentPageDomainIds,
  domains,
  userId,
}: SyncMenuProps) {
  const [tldOpen, setTldOpen] = useState(false);
  const { sync: syncSedo, isSyncing: isSedoSyncing, error: sedoError } = useSedoSync();
  const {
    sync: syncSpaceship,
    isSyncing: isSpaceshipSyncing,
    error: spaceshipError,
  } = useSpaceshipSync();

  async function handleSedo() {
    try {
      await syncSedo();
      toast.success("Sedo listings synced");
    } catch (err) {
      toast.error(sedoError ?? (err instanceof Error ? err.message : "Sync failed"));
    }
  }

  async function handleSpaceship() {
    try {
      await syncSpaceship();
      toast.success("Spaceship listings synced");
    } catch (err) {
      toast.error(spaceshipError ?? (err instanceof Error ? err.message : "Sync failed"));
    }
  }

  const busy = isSedoSyncing || isSpaceshipSyncing;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={busy}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${busy ? "animate-spin" : ""}`} />
            {busy ? "Syncing..." : "Sync"}
            <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[11rem]">
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setTimeout(() => setTldOpen(true), 0);
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Sync TLDs
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleSedo} disabled={isSedoSyncing}>
            <RefreshCw className="h-4 w-4" />
            Sync Sedo
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleSpaceship} disabled={isSpaceshipSyncing}>
            <RefreshCw className="h-4 w-4" />
            Sync Spaceship
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TldSyncModal
        hideTrigger
        open={tldOpen}
        onOpenChange={setTldOpen}
        totalDomains={totalDomains}
        currentPageDomainIds={currentPageDomainIds}
        domains={domains}
        userId={userId}
      />
    </>
  );
}
