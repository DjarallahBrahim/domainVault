import { createClient } from "@/lib/supabase/client";

export interface SedoCredentialsData {
  sedo_partner_id: number;
  sedo_signkey: string;
  sedo_username: string;
  /** Omit to keep the password already stored. */
  sedo_password?: string;
}

export async function upsertSedoCredentials(data: SedoCredentialsData): Promise<void> {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  const payload: Record<string, unknown> = {
    user_id: user.id,
    sedo_partner_id: data.sedo_partner_id,
    sedo_signkey: data.sedo_signkey,
    sedo_username: data.sedo_username,
  };
  if (data.sedo_password) payload.sedo_password = data.sedo_password;

  const { error } = await supabase
    .from("user_settings")
    .upsert(payload as never, { onConflict: "user_id" });

  if (error) throw error;
}

/**
 * Fetches the stored Sedo password on demand. Callers should keep the value
 * only briefly and drop it once the user has seen it.
 */
export async function fetchSedoPassword(): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_settings")
    .select("sedo_password")
    .maybeSingle();

  if (error) throw error;
  return (data as { sedo_password: string | null } | null)?.sedo_password ?? null;
}

/** Fetches the stored Spaceship API secret on demand. */
export async function fetchSpaceshipApiSecret(): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_settings")
    .select("spaceship_api_secret")
    .maybeSingle();

  if (error) throw error;
  return (
    (data as { spaceship_api_secret: string | null } | null)
      ?.spaceship_api_secret ?? null
  );
}
