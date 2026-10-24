import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-keys";
import type { AfternicListing } from "@/types/afternic";

async function fetchAfternicListingsMap(): Promise<Map<string, AfternicListing>> {
  const supabase = createClient();

  const { data, error } = await supabase.from("afternic_listings").select("*").order("domain_name");

  if (error) throw error;

  const map = new Map<string, AfternicListing>();
  for (const row of (data ?? []) as unknown as Array<{ domain_id: string } & AfternicListing>) {
    map.set(row.domain_id, row as unknown as AfternicListing);
  }

  return map;
}

export function useAfternicListings() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.afternicListings.all,
    queryFn: fetchAfternicListingsMap,
    staleTime: 5 * 60 * 1000,
  });

  return {
    listings: data ?? new Map<string, AfternicListing>(),
    isLoading,
  };
}
