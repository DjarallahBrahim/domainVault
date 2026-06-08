import { createClient } from "@/lib/supabase/client";

export async function deleteSedoListing(domainId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("sedo_listings")
    .delete()
    .eq("domain_id", domainId);

  if (error) throw error;
}

export async function upsertSedoListing(data: {
  domain_id: string;
  domain_name: string;
  sedo_price: number;
  sedo_minprice: number;
  sedo_fixedprice: number;
  sedo_currency: number;
  sedo_forsale: number;
}): Promise<void> {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  const { error } = await supabase.from("sedo_listings").upsert(
    {
      user_id: user.id,
      domain_id: data.domain_id,
      domain_name: data.domain_name,
      sedo_price: data.sedo_price,
      sedo_minprice: data.sedo_minprice,
      sedo_fixedprice: data.sedo_fixedprice,
      sedo_currency: data.sedo_currency,
      sedo_forsale: data.sedo_forsale,
    } as never,
    { onConflict: "domain_id" }
  );

  if (error) throw error;
}

export async function cleanupStaleListings(activeDomainIds: string[]): Promise<void> {
  const supabase = createClient();

  if (activeDomainIds.length === 0) {
    const { error } = await supabase
      .from("sedo_listings")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from("sedo_listings")
    .delete()
    .not("domain_id", "in", `(${activeDomainIds.join(",")})`);

  if (error) throw error;
}
