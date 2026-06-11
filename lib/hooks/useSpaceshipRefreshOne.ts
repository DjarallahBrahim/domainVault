import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-keys";
import type { SpaceshipListing } from "@/types/spaceship";
import { toast } from "sonner";

export function useSpaceshipRefreshOne() {
  const queryClient = useQueryClient();
  const [refreshingDomains, setRefreshingDomains] = useState<Set<string>>(new Set());

  async function refreshOne(domainName: string, domainId: string) {
    if (refreshingDomains.has(domainId)) return;

    setRefreshingDomains((prev) => new Set(prev).add(domainId));

    try {
      const response = await fetch(
        `/api/spaceship/get?domain=${encodeURIComponent(domainName)}`
      );

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error ?? "Could not reach Spaceship. Try again.");
      }

      const { data } = await response.json();

      if (data.listed) {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        await supabase.from("spaceship_listings").upsert(
          {
            user_id: user?.id,
            domain_id: domainId,
            domain_name: domainName.toLowerCase(),
            spaceship_domain_id: data.spaceshipId ?? null,
            spaceship_price: data.price,
            spaceship_minprice: data.minprice ?? 0,
            spaceship_currency: data.currency ?? "USD",
          } as never,
          { onConflict: "domain_id" }
        );

        queryClient.setQueryData<Map<string, SpaceshipListing>>(
          queryKeys.spaceshipListings.all,
          (old) => {
            const next = new Map(old ?? []);
            next.set(domainId, {
              id: "",
              user_id: user?.id ?? "",
              domain_id: domainId,
              domain_name: domainName.toLowerCase(),
              spaceship_domain_id: data.spaceshipId ?? null,
              spaceship_price: Number(data.price) || 0,
              spaceship_minprice: Number(data.minprice) || 0,
              spaceship_currency: data.currency ?? "USD",
              last_synced_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
            return next;
          }
        );

        toast.success(`${domainName} synced from Spaceship`);
      } else {
        const supabase = createClient();
        await supabase
          .from("spaceship_listings")
          .delete()
          .eq("domain_id", domainId);

        queryClient.setQueryData<Map<string, SpaceshipListing>>(
          queryKeys.spaceshipListings.all,
          (old) => {
            const next = new Map(old ?? []);
            next.delete(domainId);
            return next;
          }
        );

        toast(`${domainName} is not listed on Spaceship`);
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
