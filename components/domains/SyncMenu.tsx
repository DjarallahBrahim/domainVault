"use client";

import { useEffect, useState } from "react";
import { RefreshCw, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useSedoSync } from "@/lib/hooks/useSedoSync";
import { useSpaceshipSync } from "@/lib/hooks/useSpaceshipSync";
import { useAfternicSync } from "@/lib/hooks/useAfternicSync";
import type { AfternicSyncResult } from "@/lib/hooks/useAfternicSync";
import { TldSyncModal } from "./TldSyncModal";

interface SyncMenuProps {
  totalDomains: number;
  currentPageDomainIds: string[];
  domains: Array<{ id: string; domain: string }>;
  userId: string;
  onAfternicSynced?: (result: AfternicSyncResult) => void;
}

export function SyncMenu({
  totalDomains,
  currentPageDomainIds,
  domains,
  userId,
  onAfternicSynced,
}: SyncMenuProps) {
  const [tldOpen, setTldOpen] = useState(false);
  const [hasAfternicCredentials, setHasAfternicCredentials] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      const supabase = createClient();
      const { data } = await supabase
        .from("user_settings")
        .select("afternic_api_key")
        .maybeSingle();
      if (cancelled) return;
      setHasAfternicCredentials(
        Boolean((data as Record<string, unknown> | null)?.afternic_api_key)
      );
    }
    check();
    return () => {
      cancelled = true;
    };
  }, []);

  const { sync: syncSedo, isSyncing: isSedoSyncing, error: sedoError } = useSedoSync();
  const {
    sync: syncSpaceship,
    isSyncing: isSpaceshipSyncing,
    error: spaceshipError,
  } = useSpaceshipSync();
  const {
    sync: syncAfternic,
    isSyncing: isAfternicSyncing,
    error: afternicError,
  } = useAfternicSync();

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

  async function handleAfternic() {
    try {
      const result = await syncAfternic();
      toast.success(
        `Afternic listings synced${result.matched ? ` · ${result.matched} matched` : ""}`
      );
      onAfternicSynced?.(result);
    } catch (err) {
      toast.error(afternicError ?? (err instanceof Error ? err.message : "Sync failed"));
    }
  }

  const busy = isSedoSyncing || isSpaceshipSyncing || isAfternicSyncing;

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
          <DropdownMenuItem
            onSelect={handleAfternic}
            disabled={isAfternicSyncing || hasAfternicCredentials === false}
            title={
              hasAfternicCredentials === false ? "Add Afternic credentials in Settings" : undefined
            }
          >
            <RefreshCw className="h-4 w-4" />
            Sync Afternic
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
