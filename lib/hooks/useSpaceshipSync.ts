import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-keys";
import {
  upsertSpaceshipListing,
  cleanupStaleSpaceshipListings,
} from "@/lib/supabase/queries/spaceship-listings-client";

export function useSpaceshipSync() {
  const queryClient = useQueryClient();
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/spaceship/list");

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error ?? "Could not reach Spaceship. Try again.");
      }

      const { data } = await response.json();
      const listings = (data?.listings ?? []) as Array<{
        domain: string;
        id?: string;
        price: number;
        minprice?: number;
        currency?: string;
      }>;

      const supabase = createClient();
      const matchedDomainIds: string[] = [];

      for (const listing of listings) {
        const domainName = String(listing.domain).trim().toLowerCase();

        const { data: domainData } = await supabase
          .from("domains")
          .select("id")
          .ilike("domain", domainName)
          .limit(1);

        if (domainData && domainData.length > 0) {
          const domainId = String((domainData[0] as unknown as { id: string }).id);

          await upsertSpaceshipListing({
            domain_id: domainId,
            domain_name: domainName,
            spaceship_domain_id: listing.id ?? null,
            spaceship_price: Number(listing.price) || 0,
            spaceship_minprice: Number(listing.minprice) || 0,
            spaceship_currency: listing.currency ?? "USD",
          });

          matchedDomainIds.push(domainId);
        }
      }

      await cleanupStaleSpaceshipListings(matchedDomainIds);

      setLastSyncedAt(new Date());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.spaceshipListings.all });
    },
  });

  return {
    sync: mutation.mutateAsync,
    isSyncing: mutation.isPending,
    lastSyncedAt,
    error: mutation.error ? (mutation.error as Error).message : null,
  };
}
