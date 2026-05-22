import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";

type SaleRow = Database["public"]["Tables"]["sales"]["Row"];
type SaleInsert = Database["public"]["Tables"]["sales"]["Insert"];
type SaleUpdate = Database["public"]["Tables"]["sales"]["Update"];

export interface SalesFilters {
  sort?: string;
  order?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
}

const PAGE_SIZE = 50;

export async function fetchSales(filters: SalesFilters) {
  const supabase = createClient();

  const page = filters.page ?? 1;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
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

export interface CreateSaleData {
  domain_name: string;
  sale_price: number;
  sold_at: string;
  buyer?: string | null;
  platform?: string | null;
  notes?: string | null;
}

export interface CreateSaleResult {
  sale: SaleRow;
  warning?: "expired" | "already_sold";
}

export async function createSale(
  data: CreateSaleData
): Promise<CreateSaleResult> {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  const normalized = data.domain_name.trim().toLowerCase();
  const { data: domainData } = await supabase
    .from("domains")
    .select("id, status")
    .ilike("domain", normalized)
    .limit(1);

  const matchedDomain =
    domainData && domainData.length > 0
      ? (domainData[0] as unknown as { id: string; status: string })
      : null;

  let warning: "expired" | "already_sold" | undefined;

  if (matchedDomain) {
    if (matchedDomain.status === "expired") {
      warning = "expired";
    } else if (matchedDomain.status === "sold") {
      warning = "already_sold";
    }
  }

  const payload = {
    user_id: user.id,
    domain_id: matchedDomain?.id ?? null,
    domain_name: data.domain_name,
    sale_price: data.sale_price,
    sold_at: data.sold_at,
    buyer: data.buyer ?? null,
    platform: data.platform ?? null,
    notes: data.notes ?? null,
  } as unknown as SaleInsert;

  const { data: sale, error } = await supabase
    .from("sales")
    .insert(payload as never)
    .select()
    .single();

  if (error) throw error;

  if (matchedDomain && matchedDomain.status !== "sold") {
    await supabase
      .from("domains")
      .update({ status: "sold" } as never)
      .eq("id", matchedDomain.id);
  }

  return {
    sale: sale as unknown as SaleRow,
    warning,
  };
}

export async function updateSale(
  id: string,
  data: CreateSaleData
) {
  const supabase = createClient();

  const { data: current, error: fetchError } = await supabase
    .from("sales")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !current) throw new Error("Sale not found");

  const normalized = data.domain_name.trim().toLowerCase();
  const { data: domainData } = await supabase
    .from("domains")
    .select("id, status")
    .ilike("domain", normalized)
    .limit(1);

  const matchedDomain =
    domainData && domainData.length > 0
      ? (domainData[0] as unknown as { id: string; status: string })
      : null;

  const currentSale = current as unknown as SaleRow;

  if (
    currentSale.domain_id &&
    matchedDomain &&
    matchedDomain.id !== currentSale.domain_id
  ) {
    const { count: remainingCount } = await supabase
      .from("sales")
      .select("*", { count: "exact", head: true })
      .eq("domain_id", currentSale.domain_id)
      .neq("id", id);

    if (!remainingCount || remainingCount === 0) {
      await supabase
        .from("domains")
        .update({ status: "active" } as never)
        .eq("id", currentSale.domain_id);
    }
  }

  const payload = {
    domain_id: matchedDomain?.id ?? null,
    domain_name: data.domain_name,
    sale_price: data.sale_price,
    sold_at: data.sold_at,
    buyer: data.buyer ?? null,
    platform: data.platform ?? null,
    notes: data.notes ?? null,
  } as unknown as SaleUpdate;

  const { data: updated, error } = await supabase
    .from("sales")
    .update(payload as never)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  if (matchedDomain && matchedDomain.status !== "sold") {
    await supabase
      .from("domains")
      .update({ status: "sold" } as never)
      .eq("id", matchedDomain.id);
  }

  return updated as unknown as SaleRow;
}

export async function deleteSale(id: string) {
  const supabase = createClient();

  const { data: current, error: fetchError } = await supabase
    .from("sales")
    .select("domain_id")
    .eq("id", id)
    .single();

  if (fetchError || !current) throw new Error("Sale not found");

  const currentSale = current as unknown as { domain_id: string | null };

  const { error } = await supabase.from("sales").delete().eq("id", id);
  if (error) throw error;

  if (currentSale.domain_id) {
    const { count: remainingCount } = await supabase
      .from("sales")
      .select("*", { count: "exact", head: true })
      .eq("domain_id", currentSale.domain_id);

    if (!remainingCount || remainingCount === 0) {
      await supabase
        .from("domains")
        .update({ status: "active" } as never)
        .eq("id", currentSale.domain_id)
        .eq("status", "sold");
    }
  }
}
