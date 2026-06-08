import { createClient as createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

type UserSettingsRow = Database["public"]["Tables"]["user_settings"]["Row"];

export async function fetchUserSettings(): Promise<UserSettingsRow | null> {
  const supabase = createServerClient();
  const resolved = await supabase;

  const { data, error } = await resolved
    .from("user_settings")
    .select("*")
    .single();

  if (error && error.code !== "PGRST116") throw error;

  return data as unknown as UserSettingsRow | null;
}
