import { createClient } from "@/lib/supabase/client";

export async function deleteSpaceshipListing(domainId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("spaceship_listings")
    .delete()
    .eq("domain_id", domainId);

  if (error) throw error;
}

export async function upsertSpaceshipListing(data: {
  domain_id: string;
  domain_name: string;
  spaceship_domain_id?: string | null;
  spaceship_price: number;
  spaceship_minprice?: number;
  spaceship_currency: string;
}): Promise<void> {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  const { error } = await supabase.from("spaceship_listings").upsert(
    {
      user_id: user.id,
      domain_id: data.domain_id,
      domain_name: data.domain_name,
      spaceship_domain_id: data.spaceship_domain_id ?? null,
      spaceship_price: data.spaceship_price,
      spaceship_minprice: data.spaceship_minprice ?? 0,
      spaceship_currency: data.spaceship_currency,
    } as never,
    { onConflict: "domain_id" }
  );

  if (error) throw error;
}

export async function cleanupStaleSpaceshipListings(activeDomainIds: string[]): Promise<void> {
  const supabase = createClient();

  if (activeDomainIds.length === 0) {
    const { error } = await supabase
      .from("spaceship_listings")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from("spaceship_listings")
    .delete()
    .not("domain_id", "in", `(${activeDomainIds.join(",")})`);

  if (error) throw error;
}
