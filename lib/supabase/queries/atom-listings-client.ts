import { createClient } from "@/lib/supabase/client";
import type { AtomCachePayload } from "@/lib/atom/mappers";

export interface AtomListingInput extends AtomCachePayload {
  domain_id: string;
}

export async function deleteAtomListing(domainId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("atom_listings").delete().eq("domain_id", domainId);

  if (error) throw error;
}

export async function upsertAtomListing(data: AtomListingInput): Promise<void> {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  const { error } = await supabase.from("atom_listings").upsert(
    {
      user_id: user.id,
      domain_id: data.domain_id,
      domain_name: data.domain_name,
      atom_id: data.atom_id,
      list_status: data.list_status,
      listing_type: data.listing_type,
      listing_type_raw: data.listing_type_raw,
      selling_price: data.selling_price,
      full_price: data.full_price,
      discount: data.discount,
      primary_category: data.primary_category,
      logo_image: data.logo_image,
      listed_at: data.listed_at,
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as never,
    { onConflict: "domain_id" }
  );

  if (error) throw error;
}

export async function cleanupStaleAtomListings(activeDomainIds: string[]): Promise<void> {
  const supabase = createClient();

  if (activeDomainIds.length === 0) {
    const { error } = await supabase
      .from("atom_listings")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from("atom_listings")
    .delete()
    .not("domain_id", "in", `(${activeDomainIds.join(",")})`);

  if (error) throw error;
}
