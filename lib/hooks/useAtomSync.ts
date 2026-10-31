import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-keys";
import type { AtomCachePayload } from "@/lib/atom/mappers";
import {
  cleanupStaleAtomListings,
  upsertAtomListing,
} from "@/lib/supabase/queries/atom-listings-client";
import { toAsciiDomain } from "@/lib/atom/names";

interface RemoteListing {
  domain: string;
  payload: AtomCachePayload;
}

interface LocalDomain {
  id: string;
  domain: string;
  status: string;
}

export interface AtomUnmatchedDomain {
  domain: string;
  payload: AtomCachePayload;
}

export interface AtomSyncResult {
  total: number;
  matched: number;
  unmatched: AtomUnmatchedDomain[];
}

async function fetchAllLocalDomains(userId: string): Promise<LocalDomain[]> {
  const supabase = createClient();
  const pageSize = 1000;
  const rows: LocalDomain[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("domains")
      .select("id, domain, status")
      .eq("user_id", userId)
      .range(from, from + pageSize - 1);

    if (error) throw error;

    const batch = (data ?? []) as unknown as LocalDomain[];
    rows.push(...batch);
    if (batch.length < pageSize) break;
  }

  return rows;
}

export function useAtomSync() {
  const queryClient = useQueryClient();
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const mutation = useMutation({
    mutationFn: async (): Promise<AtomSyncResult> => {
      const response = await fetch("/api/atom/list");
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body.error ?? "Could not reach Atom. Try again.");
      }

      const listings = (body?.data?.listings ?? []) as RemoteListing[];

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const localDomains = await fetchAllLocalDomains(user.id);
      const localByName = new Map(localDomains.map((row) => [toAsciiDomain(row.domain), row]));

      const matchedDomainIds: string[] = [];
      const unmatched: AtomUnmatchedDomain[] = [];

      for (const listing of listings) {
        const name = toAsciiDomain(String(listing.domain));
        const local = localByName.get(name);

        if (!local) {
          unmatched.push({ domain: name, payload: listing.payload });
          continue;
        }

        await upsertAtomListing({ ...listing.payload, domain_id: local.id });
        matchedDomainIds.push(local.id);
      }

      await cleanupStaleAtomListings(matchedDomainIds);
      setLastSyncedAt(new Date());

      return {
        total: listings.length,
        matched: matchedDomainIds.length,
        unmatched,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.atomListings.all });
    },
  });

  return {
    sync: mutation.mutateAsync,
    isSyncing: mutation.isPending,
    lastSyncedAt,
    error: mutation.error ? (mutation.error as Error).message : null,
  };
}
