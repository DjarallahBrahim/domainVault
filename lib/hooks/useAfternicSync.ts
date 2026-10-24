import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-keys";
import type { AfternicCachePayload } from "@/lib/afternic/mappers";
import {
  cleanupStaleAfternicListings,
  upsertAfternicListing,
} from "@/lib/supabase/queries/afternic-listings-client";

interface RemoteListing {
  domain: string;
  payload: AfternicCachePayload;
}

interface LocalDomain {
  id: string;
  domain: string;
  status: string;
}

export interface AfternicUnmatchedDomain {
  domain: string;
  payload: AfternicCachePayload;
}

export interface AfternicSoldDomain {
  domainId: string;
  domain: string;
  buynowPrice: number | null;
}

export interface AfternicSyncResult {
  total: number;
  matched: number;
  unmatched: AfternicUnmatchedDomain[];
  sold: AfternicSoldDomain[];
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

export function useAfternicSync() {
  const queryClient = useQueryClient();
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const mutation = useMutation({
    mutationFn: async (): Promise<AfternicSyncResult> => {
      const response = await fetch("/api/afternic/list");
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body.error ?? "Could not reach Afternic. Try again.");
      }

      const listings = (body?.data?.listings ?? []) as RemoteListing[];

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const localDomains = await fetchAllLocalDomains(user.id);
      const localByName = new Map(localDomains.map((row) => [row.domain.toLowerCase(), row]));

      const matchedDomainIds: string[] = [];
      const unmatched: AfternicUnmatchedDomain[] = [];
      const sold: AfternicSoldDomain[] = [];

      for (const listing of listings) {
        const name = String(listing.domain).trim().toLowerCase();
        const local = localByName.get(name);

        if (!local) {
          unmatched.push({ domain: name, payload: listing.payload });
          continue;
        }

        await upsertAfternicListing({
          ...listing.payload,
          domain_id: local.id,
        });

        matchedDomainIds.push(local.id);

        if (listing.payload.list_status === "SOLD" && local.status !== "sold") {
          sold.push({
            domainId: local.id,
            domain: name,
            buynowPrice: listing.payload.buynow_price,
          });
        }
      }

      await cleanupStaleAfternicListings(matchedDomainIds);
      setLastSyncedAt(new Date());

      return {
        total: listings.length,
        matched: matchedDomainIds.length,
        unmatched,
        sold,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.afternicListings.all });
    },
  });

  return {
    sync: mutation.mutateAsync,
    isSyncing: mutation.isPending,
    lastSyncedAt,
    error: mutation.error ? (mutation.error as Error).message : null,
  };
}
