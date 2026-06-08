import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-keys";
import type { SedoListing } from "@/types/sedo";

async function fetchSedoListingsMap(): Promise<Map<string, SedoListing>> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("sedo_listings")
    .select("*")
    .order("domain_name");

  if (error) throw error;

  const map = new Map<string, SedoListing>();
  for (const row of (data ?? []) as unknown as Array<{ domain_id: string } & SedoListing>) {
    map.set(row.domain_id, row as unknown as SedoListing);
  }

  return map;
}

export function useSedoListings() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.sedoListings.all,
    queryFn: fetchSedoListingsMap,
    staleTime: 5 * 60 * 1000,
  });

  return {
    listings: data ?? new Map<string, SedoListing>(),
    isLoading,
  };
}
