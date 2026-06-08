import { createClient as createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

type SedoListingRow = Database["public"]["Tables"]["sedo_listings"]["Row"];

export async function fetchSedoListings(): Promise<SedoListingRow[]> {
  const supabase = createServerClient();
  const resolved = await supabase;

  const { data, error } = await resolved
    .from("sedo_listings")
    .select("*")
    .order("domain_name");

  if (error) throw error;

  return (data ?? []) as unknown as SedoListingRow[];
}
