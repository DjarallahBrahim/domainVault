import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-keys";
import type { AtomListing } from "@/types/atom";

async function fetchAtomListingsMap(): Promise<Map<string, AtomListing>> {
  const supabase = createClient();

  const { data, error } = await supabase.from("atom_listings").select("*").order("domain_name");

  if (error) throw error;

  const map = new Map<string, AtomListing>();
  for (const row of (data ?? []) as unknown as Array<{ domain_id: string } & AtomListing>) {
    map.set(row.domain_id, row as unknown as AtomListing);
  }

  return map;
}

export function useAtomListings() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.atomListings.all,
    queryFn: fetchAtomListingsMap,
    staleTime: 5 * 60 * 1000,
  });

  return {
    listings: data ?? new Map<string, AtomListing>(),
    isLoading,
  };
}
