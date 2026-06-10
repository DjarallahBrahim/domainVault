import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-keys";
import type { SedoListing } from "@/types/sedo";
import { toast } from "sonner";

export function useSedoRefreshOne() {
  const queryClient = useQueryClient();
  const [refreshingDomains, setRefreshingDomains] = useState<Set<string>>(new Set());

  async function refreshOne(domainName: string, domainId: string) {
    if (refreshingDomains.has(domainId)) return;

    setRefreshingDomains((prev) => new Set(prev).add(domainId));

    try {
      const response = await fetch(
        `/api/sedo/status?domain=${encodeURIComponent(domainName)}`
      );

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error ?? "Could not reach Sedo. Try again.");
      }

      const { data } = await response.json();

      if (data.listed) {
        const supabase = createClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();

        await supabase.from("sedo_listings").upsert(
          {
            user_id: user?.id,
            domain_id: domainId,
            domain_name: domainName.toLowerCase(),
            sedo_price: data.price,
            sedo_minprice: 0,
            sedo_fixedprice: 1,
            sedo_currency: data.currency ?? 1,
            sedo_forsale: 1,
          } as never,
          { onConflict: "domain_id" }
        );

        queryClient.setQueryData<Map<string, SedoListing>>(
          queryKeys.sedoListings.all,
          (old) => {
            const next = new Map(old ?? []);
            next.set(domainId, {
              id: "",
              user_id: user?.id ?? "",
              domain_id: domainId,
              domain_name: domainName.toLowerCase(),
              sedo_price: data.price,
              sedo_minprice: 0,
              sedo_fixedprice: 1,
              sedo_currency: data.currency ?? 1,
              sedo_forsale: 1,
              last_synced_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
            return next;
          }
        );

        toast.success(`${domainName} synced from Sedo`);
      } else {
        const supabase = createClient();
        await supabase
          .from("sedo_listings")
          .delete()
          .eq("domain_id", domainId);

        queryClient.setQueryData<Map<string, SedoListing>>(
          queryKeys.sedoListings.all,
          (old) => {
            const next = new Map(old ?? []);
            next.delete(domainId);
            return next;
          }
        );

        toast(`${domainName} is not listed on Sedo`);
      }
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
