import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";
import type { Json } from "@/types/supabase";

type ImportLogRow = Database["public"]["Tables"]["import_logs"]["Row"];

export interface ImportError {
  row: number;
  field: string;
  message: string;
}

export async function fetchImportLogs() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("import_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  return (data ?? []) as unknown as ImportLogRow[];
}

export async function fetchImportLogDetail(id: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("import_logs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data as unknown as ImportLogRow;
}

export async function createImportLog(params: {
  filename: string;
  total_rows: number;
  imported: number;
  skipped: number;
  errors: ImportError[] | null;
}) {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) throw new Error("Not authenticated");

  const errorsJson: Json | null = params.errors?.length
    ? (params.errors as unknown as Json)
    : null;

  const payload = {
    user_id: user.id,
    filename: params.filename,
    total_rows: params.total_rows,
    imported: params.imported,
    skipped: params.skipped,
    errors: errorsJson,
  };

  const { data, error } = await supabase
    .from("import_logs")
    .insert(payload as never)
    .select()
    .single();

  if (error) throw error;

  return data as unknown as ImportLogRow;
}
