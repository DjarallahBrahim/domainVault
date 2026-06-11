import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-keys";
import type { SpaceshipListing } from "@/types/spaceship";

async function fetchSpaceshipListingsMap(): Promise<Map<string, SpaceshipListing>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("spaceship_listings")
    .select("*")
    .order("domain_name");

  if (error) throw error;

  const map = new Map<string, SpaceshipListing>();
  for (const row of (data ?? []) as unknown as Array<{ domain_id: string } & SpaceshipListing>) {
    map.set(row.domain_id, row as unknown as SpaceshipListing);
  }

  return map;
}

export function useSpaceshipListings() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.spaceshipListings.all,
    queryFn: fetchSpaceshipListingsMap,
    staleTime: 5 * 60 * 1000,
  });

  return {
    listings: data ?? new Map<string, SpaceshipListing>(),
    isLoading,
  };
}
