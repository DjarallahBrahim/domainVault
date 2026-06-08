import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-keys";
import { upsertSedoListing, cleanupStaleListings } from "@/lib/supabase/queries/sedo-listings-client";

export function useSedoSync() {
  const queryClient = useQueryClient();
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/sedo/list");

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error ?? "Could not reach Sedo. Try again.");
      }

      const { data } = await response.json();
      const listings = (data?.listings ?? []) as Array<{
        domain: string;
        price: number;
        minprice: number;
        fixedprice: number;
        currency: number;
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

          await upsertSedoListing({
            domain_id: domainId,
            domain_name: domainName,
            sedo_price: Number(listing.price),
            sedo_minprice: Number(listing.minprice),
            sedo_fixedprice: Number(listing.fixedprice),
            sedo_currency: Number(listing.currency),
            sedo_forsale: 1,
          });

          matchedDomainIds.push(domainId);
        }
      }

      await cleanupStaleListings(matchedDomainIds);

      setLastSyncedAt(new Date());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sedoListings.all });
    },
  });

  return {
    sync: mutation.mutateAsync,
    isSyncing: mutation.isPending,
    lastSyncedAt,
    error: mutation.error ? (mutation.error as Error).message : null,
  };
}
