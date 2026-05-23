import { createClient as createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

type SaleRow = Database["public"]["Tables"]["sales"]["Row"];

export interface SalesFilters {
  sort?: string;
  order?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
}

const PAGE_SIZE = 50;

export async function fetchSales(filters: SalesFilters) {
  const supabase = createServerClient();
  const resolved = await supabase;

  const page = filters.page ?? 1;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = resolved
    .from("sales")
    .select("*", { count: "exact" });

  if (filters.startDate) {
    query = query.gte("sold_at", filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte("sold_at", filters.endDate);
  }

  const sortColumn = (filters.sort ?? "sold_at") as keyof SaleRow;
  const sortOrder = filters.order === "asc";

  query = query
    .order(sortColumn, { ascending: sortOrder })
    .range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    sales: (data ?? []) as unknown as SaleRow[],
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
  };
}

export async function fetchSaleById(id: string) {
  const supabase = createServerClient();
  const resolved = await supabase;

  const { data, error } = await resolved
    .from("sales")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data as unknown as SaleRow;
}

export async function lookupDomain(
  name: string
): Promise<{ id: string; status: string } | null> {
  const supabase = createServerClient();
  const resolved = await supabase;

  const { data, error } = await resolved
    .from("domains")
    .select("id, status")
    .ilike("domain", name.trim())
    .limit(1);

  if (error) throw error;

  if (!data || data.length === 0) return null;
  return data[0] as unknown as { id: string; status: string };
}

export async function countSalesForDomain(
  domainId: string
): Promise<number> {
  const supabase = createServerClient();
  const resolved = await supabase;

  const { count, error } = await resolved
    .from("sales")
    .select("*", { count: "exact", head: true })
    .eq("domain_id", domainId);

  if (error) throw error;

  return count ?? 0;
}
