import { createClient } from "@/lib/supabase/client";

export interface SedoCredentialsData {
  sedo_partner_id: number;
  sedo_signkey: string;
  sedo_username: string;
  sedo_password: string;
}

export async function upsertSedoCredentials(data: SedoCredentialsData): Promise<void> {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  const { error } = await supabase.from("user_settings").upsert(
    {
      user_id: user.id,
      sedo_partner_id: data.sedo_partner_id,
      sedo_signkey: data.sedo_signkey,
      sedo_username: data.sedo_username,
      sedo_password: data.sedo_password,
    } as never,
    { onConflict: "user_id" }
  );

  if (error) throw error;
}
