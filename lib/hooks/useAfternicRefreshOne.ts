import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { AfternicCachePayload } from "@/lib/afternic/mappers";
import {
  deleteAfternicListing,
  upsertAfternicListing,
} from "@/lib/supabase/queries/afternic-listings-client";
import type { AfternicListing } from "@/types/afternic";
import { toast } from "sonner";

interface StatusResponse {
  data?: {
    domain: string;
    listed: boolean;
    payload: AfternicCachePayload | null;
  };
  error?: string;
}

export function useAfternicRefreshOne() {
  const queryClient = useQueryClient();
  const [refreshingDomains, setRefreshingDomains] = useState<Set<string>>(new Set());

  async function refreshOne(domainName: string, domainId: string, options?: { silent?: boolean }) {
    if (refreshingDomains.has(domainId)) return;

    setRefreshingDomains((prev) => new Set(prev).add(domainId));

    try {
      const response = await fetch(`/api/afternic/status?domain=${encodeURIComponent(domainName)}`);
      const body = (await response.json().catch(() => ({}))) as StatusResponse;

      if (!response.ok) {
        throw new Error(body.error ?? "Could not reach Afternic. Try again.");
      }

      if (body.data?.listed && body.data.payload) {
        await upsertAfternicListing({
          ...body.data.payload,
          domain_id: domainId,
        });

        const listing: AfternicListing = {
          id: "",
          user_id: "",
          domain_id: domainId,
          ...body.data.payload,
          last_synced_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as AfternicListing;

        queryClient.setQueryData<Map<string, AfternicListing>>(
          queryKeys.afternicListings.all,
          (old) => {
            const next = new Map(old ?? []);
            next.set(domainId, listing);
            return next;
          }
        );

        if (!options?.silent) {
          toast.success(`${domainName} synced from Afternic`);
        }
      } else {
        await deleteAfternicListing(domainId);

        queryClient.setQueryData<Map<string, AfternicListing>>(
          queryKeys.afternicListings.all,
          (old) => {
            const next = new Map(old ?? []);
            next.delete(domainId);
            return next;
          }
        );

        if (!options?.silent) {
          toast(`${domainName} is not listed on Afternic`);
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reach Afternic. Try again.");
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
