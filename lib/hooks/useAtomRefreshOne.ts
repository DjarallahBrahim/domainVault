import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { AtomCachePayload } from "@/lib/atom/mappers";
import { deleteAtomListing, upsertAtomListing } from "@/lib/supabase/queries/atom-listings-client";
import type { AtomListing } from "@/types/atom";
import { toast } from "sonner";

interface StatusResponse {
  data?: {
    domain: string;
    listed: boolean;
    payload: AtomCachePayload | null;
  };
  error?: string;
}

export function useAtomRefreshOne() {
  const queryClient = useQueryClient();
  const [refreshingDomains, setRefreshingDomains] = useState<Set<string>>(new Set());

  async function refreshOne(domainName: string, domainId: string, options?: { silent?: boolean }) {
    if (refreshingDomains.has(domainId)) return;

    setRefreshingDomains((prev) => new Set(prev).add(domainId));

    try {
      const response = await fetch(`/api/atom/status?domain=${encodeURIComponent(domainName)}`);
      const body = (await response.json().catch(() => ({}))) as StatusResponse;

      if (!response.ok) {
        throw new Error(body.error ?? "Could not reach Atom. Try again.");
      }

      if (body.data?.listed && body.data.payload) {
        await upsertAtomListing({ ...body.data.payload, domain_id: domainId });

        const listing: AtomListing = {
          id: "",
          user_id: "",
          domain_id: domainId,
          ...body.data.payload,
          last_synced_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as AtomListing;

        queryClient.setQueryData<Map<string, AtomListing>>(queryKeys.atomListings.all, (old) => {
          const next = new Map(old ?? []);
          next.set(domainId, listing);
          return next;
        });

        if (!options?.silent) {
          toast.success(`${domainName} synced from Atom`);
        }
      } else {
        await deleteAtomListing(domainId);

        queryClient.setQueryData<Map<string, AtomListing>>(queryKeys.atomListings.all, (old) => {
          const next = new Map(old ?? []);
          next.delete(domainId);
          return next;
        });

        if (!options?.silent) {
          toast(`${domainName} is not listed on Atom`);
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reach Atom. Try again.");
    } finally {
      setRefreshingDomains((prev) => {
        const next = new Set(prev);
        next.delete(domainId);
        return next;
      });
    }
  }

  return {
    refreshOne,
    isRefreshing: (domainId: string) => refreshingDomains.has(domainId),
  };
}
