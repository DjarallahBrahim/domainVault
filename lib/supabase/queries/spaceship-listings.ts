import { createClient as createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

type SpaceshipListingRow = Database["public"]["Tables"]["spaceship_listings"]["Row"];

export async function fetchSpaceshipListings(): Promise<SpaceshipListingRow[]> {
  const supabase = createServerClient();
  const resolved = await supabase;

  const { data, error } = await resolved
    .from("spaceship_listings")
    .select("*")
    .order("domain_name");

  if (error) throw error;

  return (data ?? []) as unknown as SpaceshipListingRow[];
}
