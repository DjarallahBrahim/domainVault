import { createClient } from "@/lib/supabase/client";
import type { AfternicCachePayload } from "@/lib/afternic/mappers";

export interface AfternicListingInput extends AfternicCachePayload {
  domain_id: string;
}

export async function deleteAfternicListing(domainId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("afternic_listings").delete().eq("domain_id", domainId);

  if (error) throw error;
}

export async function upsertAfternicListing(data: AfternicListingInput): Promise<void> {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  const { error } = await supabase.from("afternic_listings").upsert(
    {
      user_id: user.id,
      domain_id: data.domain_id,
      domain_name: data.domain_name,
      display_name: data.display_name,
      list_status: data.list_status,
      fast_transfer_status: data.fast_transfer_status,
      buynow_price: data.buynow_price,
      floor_price: data.floor_price,
      minbid_price: data.minbid_price,
      landing_page: data.landing_page,
      intake_style: data.intake_style,
      hidden: data.hidden,
      featured: data.featured,
      leasing_enabled: data.leasing_enabled,
      max_lease_period: data.max_lease_period,
      show_lander_buynow: data.show_lander_buynow,
      show_lander_makeoffer: data.show_lander_makeoffer,
      show_lander_lease: data.show_lander_lease,
      intake_views: data.intake_views,
      intake_leads: data.intake_leads,
      afternic_registrar: data.afternic_registrar,
      listed_at: data.listed_at,
      last_synced_at: new Date().toISOString(),
    } as never,
    { onConflict: "domain_id" }
  );

  if (error) throw error;
}

export async function cleanupStaleAfternicListings(activeDomainIds: string[]): Promise<void> {
  const supabase = createClient();

  if (activeDomainIds.length === 0) {
    const { error } = await supabase
      .from("afternic_listings")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from("afternic_listings")
    .delete()
    .not("domain_id", "in", `(${activeDomainIds.join(",")})`);

  if (error) throw error;
}
