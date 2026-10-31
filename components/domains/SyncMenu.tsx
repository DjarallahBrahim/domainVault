"use client";

import { useEffect, useState } from "react";
import { RefreshCw, ChevronDown, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useSedoSync } from "@/lib/hooks/useSedoSync";
import { useSpaceshipSync } from "@/lib/hooks/useSpaceshipSync";
import { useAfternicSync } from "@/lib/hooks/useAfternicSync";
import type { AfternicSyncResult } from "@/lib/hooks/useAfternicSync";
import { useAtomSync } from "@/lib/hooks/useAtomSync";
import type { AtomSyncResult } from "@/lib/hooks/useAtomSync";
import { TldSyncModal } from "./TldSyncModal";

interface SyncMenuProps {
  totalDomains: number;
  currentPageDomainIds: string[];
  domains: Array<{ id: string; domain: string }>;
  userId: string;
  onAfternicSynced?: (result: AfternicSyncResult) => void;
  onAtomSynced?: (result: AtomSyncResult) => void;
  atomUnmatchedCount?: number;
  onReviewAtomUnmatched?: () => void;
}

export function SyncMenu({
  totalDomains,
  currentPageDomainIds,
  domains,
  userId,
  onAfternicSynced,
  onAtomSynced,
  atomUnmatchedCount = 0,
  onReviewAtomUnmatched,
}: SyncMenuProps) {
  const [tldOpen, setTldOpen] = useState(false);
  const [hasAfternicCredentials, setHasAfternicCredentials] = useState<boolean | null>(null);
  const [hasAtomCredentials, setHasAtomCredentials] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("user_settings")
        .select("afternic_api_key, atom_api_token, atom_user_id")
        .maybeSingle();
      if (cancelled) return;

      if (error) {
        // The Atom migration may not be applied yet. Keep Afternic working.
        const fallback = await supabase
          .from("user_settings")
          .select("afternic_api_key")
          .maybeSingle();
        if (cancelled) return;
        setHasAfternicCredentials(
          Boolean((fallback.data as Record<string, unknown> | null)?.afternic_api_key)
        );
        setHasAtomCredentials(false);
        return;
      }

      const row = data as Record<string, unknown> | null;
      setHasAfternicCredentials(Boolean(row?.afternic_api_key));
      setHasAtomCredentials(Boolean(row?.atom_api_token && row?.atom_user_id));
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
  const { sync: syncAtom, isSyncing: isAtomSyncing, error: atomError } = useAtomSync();

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

  async function handleAtom() {
    try {
      const result = await syncAtom();
      toast.success(`Atom listings synced${result.matched ? ` · ${result.matched} matched` : ""}`);
      onAtomSynced?.(result);
    } catch (err) {
      toast.error(atomError ?? (err instanceof Error ? err.message : "Sync failed"));
    }
  }

  const busy = isSedoSyncing || isSpaceshipSyncing || isAfternicSyncing || isAtomSyncing;

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
          <DropdownMenuItem
            onSelect={handleAtom}
            disabled={isAtomSyncing || hasAtomCredentials === false}
            title={hasAtomCredentials === false ? "Add Atom credentials in Settings" : undefined}
          >
            <RefreshCw className="h-4 w-4" />
            Sync Atom
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => onReviewAtomUnmatched?.()}
            disabled={atomUnmatchedCount === 0}
            title={
              atomUnmatchedCount === 0
                ? "No saved unmatched Atom domains — run Sync Atom first"
                : undefined
            }
          >
            <Inbox className="h-4 w-4" />
            Review unmatched Atom
            {atomUnmatchedCount > 0 ? ` (${atomUnmatchedCount})` : ""}
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
