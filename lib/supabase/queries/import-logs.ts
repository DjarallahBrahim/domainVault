import { createClient as createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

type ImportLogRow = Database["public"]["Tables"]["import_logs"]["Row"];

export async function fetchImportLogs() {
  const supabase = createServerClient();
  const resolved = await supabase;

  const { data, error } = await resolved
    .from("import_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  return (data ?? []) as unknown as ImportLogRow[];
}

export async function fetchImportLogDetail(id: string) {
  const supabase = createServerClient();
  const resolved = await supabase;

  const { data, error } = await resolved
    .from("import_logs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data as unknown as ImportLogRow;
}
