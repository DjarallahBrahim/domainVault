import { createClient as createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

type DomainRow = Database["public"]["Tables"]["domains"]["Row"];

export async function autoTransitionExpired(): Promise<number> {
  const supabase = createServerClient();
  const resolved = await supabase;

  const { data, error } = await resolved
    .from("domains")
    .update({ status: "expired" } as never)
    .eq("status", "active")
    .lt("expiration_date", new Date().toISOString().split("T")[0]);

  if (error) throw error;

  return (data ?? []).length;
}

export interface DashboardStats {
  total_active: number;
  portfolio_value: number;
  total_sales: number;
  expiring_90d: number;
  expiring_30d: number;
  sold_this_year: number;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const supabase = await createServerClient();

  const { data: domains, error: domainError } = await supabase
    .from("domains")
    .select("purchase_price, status, expiration_date");

  if (domainError) throw domainError;

  const { data: salesRaw, error: salesError } = await supabase
    .from("sales")
    .select("sold_at, sale_price");

  if (salesError) throw salesError;

  const sales = (salesRaw ?? []) as unknown as Array<{ sold_at: string; sale_price: number }>;

  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0];

  const domainRows = (domains ?? []) as unknown as DomainRow[];
  const active = domainRows.filter((d) => d.status === "active");

  const portfolio_value = active.reduce((sum, d) => sum + (d.purchase_price ?? 0), 0);
  const expiring_90d = active.filter((d) => {
    const exp = new Date(d.expiration_date);
    const diff = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 90;
  }).length;
  const expiring_30d = active.filter((d) => {
    const exp = new Date(d.expiration_date);
    const diff = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 30 && diff >= 0;
  }).length;

  const sold_this_year = sales.filter((s) => s.sold_at >= yearStart).length;
  const total_sales = sales.reduce((sum, s) => sum + (s.sale_price ?? 0), 0);

  return {
    total_active: active.length,
    portfolio_value,
    total_sales,
    expiring_90d,
    expiring_30d,
    sold_this_year,
  };
}

export interface ExpirySegments {
  exp_1m: number;
  exp_3m: number;
  exp_6m: number;
  exp_9m: number;
}

export async function fetchExpirySegments(): Promise<ExpirySegments> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("domains")
    .select("expiration_date, status, domain");

  if (error) throw error;

  const rows = (data ?? []) as unknown as DomainRow[];
  const active = rows.filter((d) => d.status === "active");

  const now = new Date();
  let exp_1m = 0;
  let exp_3m = 0;
  let exp_6m = 0;
  let exp_9m = 0;

  for (const d of active) {
    const exp = new Date(d.expiration_date);
    const days = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    if (days <= 30) {
      exp_1m++;
    } else if (days <= 90) {
      exp_3m++;
    } else if (days <= 180) {
      exp_6m++;
    } else if (days <= 270) {
      exp_9m++;
    }
  }

  return { exp_1m, exp_3m, exp_6m, exp_9m };
}

export interface RegistrarBreakdown {
  registrar: string;
  domain_count: number;
}

export async function fetchRegistrarBreakdown(): Promise<RegistrarBreakdown[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("domains")
    .select("registrar, status");

  if (error) throw error;

  const rows = (data ?? []) as unknown as DomainRow[];
  const active = rows.filter((d) => d.status === "active");

  const map = new Map<string, number>();
  for (const d of active) {
    const key = d.registrar?.trim() || "Unknown";
    map.set(key, (map.get(key) ?? 0) + 1);
  }

  const breakdown: RegistrarBreakdown[] = [];
  for (const [registrar, domain_count] of map) {
    breakdown.push({ registrar, domain_count });
  }
  breakdown.sort((a, b) => b.domain_count - a.domain_count);

  return breakdown.slice(0, 10);
}

export interface PromotionWithDomain {
  id: string;
  user_id: string;
  domain_id: string;
  week_start: string;
  promoted_at: string | null;
  domain: string;
  registrar: string | null;
  expiration_date: string;
}

export async function fetchCurrentPromotions(): Promise<PromotionWithDomain[]> {
  const supabase = await createServerClient();

  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const weekStart = monday.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("promotions")
    .select(`
      id,
      user_id,
      domain_id,
      week_start,
      promoted_at,
      domains!inner (
        domain,
        registrar,
        expiration_date
      )
    `)
    .eq("week_start", weekStart)
    .order("domain_id");

  if (error) throw error;

  return ((data ?? []) as unknown as Array<{
    id: string;
    user_id: string;
    domain_id: string;
    week_start: string;
    promoted_at: string | null;
    domains: { domain: string; registrar: string | null; expiration_date: string } | null;
  }>).map((p) => ({
    id: p.id,
    user_id: p.user_id,
    domain_id: p.domain_id,
    week_start: p.week_start,
    promoted_at: p.promoted_at,
    domain: p.domains?.domain ?? "",
    registrar: p.domains?.registrar ?? null,
    expiration_date: p.domains?.expiration_date ?? "",
  }));
}

export async function fetchExpiringDomains(limit = 10): Promise<DomainRow[]> {
  const supabase = await createServerClient();
  const now = new Date();

  const { data, error } = await supabase
    .from("domains")
    .select("*")
    .eq("status", "active")
    .lte("expiration_date", new Date(now.getFullYear(), now.getMonth(), now.getDate() + 31).toISOString().split("T")[0])
    .order("expiration_date", { ascending: true })
    .limit(limit);

  if (error) throw error;

  return (data ?? []) as unknown as DomainRow[];
}

export async function fetchQuickStats(): Promise<{
  avg_price: number;
  most_common_registrar: string;
  oldest_domain: string;
  newest_domain: string;
  total_expired: number;
  total_earnings: number;
}> {
  const supabase = await createServerClient();

  const { data: domains, error } = await supabase
    .from("domains")
    .select("*");

  if (error) throw error;

  const rows = (domains ?? []) as unknown as DomainRow[];
  const active = rows.filter((d) => d.status === "active");
  const expired = rows.filter((d) => d.status === "expired");

  const prices = active.map((d) => d.purchase_price ?? 0).filter((p) => p > 0);
  const avg_price = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;

  const registrarMap = new Map<string, number>();
  for (const d of active) {
    const key = d.registrar?.trim() || "Unknown";
    registrarMap.set(key, (registrarMap.get(key) ?? 0) + 1);
  }
  let most_common_registrar = "Unknown";
  let maxCount = 0;
  for (const [k, c] of registrarMap) {
    if (c > maxCount) { maxCount = c; most_common_registrar = k; }
  }

  const sorted = [...active].sort(
    (a, b) => new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime()
  );
  const oldest_domain = sorted.length > 0 ? sorted[0].domain : "—";
  const newest_domain = sorted.length > 0 ? sorted[sorted.length - 1].domain : "—";

  const { data: salesRaw } = await supabase
    .from("sales")
    .select("sale_price");
  const sales = (salesRaw ?? []) as unknown as Array<{ sale_price: number }>;
  const total_earnings = sales.reduce((sum, s) => sum + (s.sale_price ?? 0), 0);

  return {
    avg_price: Math.round(avg_price * 100) / 100,
    most_common_registrar,
    oldest_domain,
    newest_domain,
    total_expired: expired.length,
    total_earnings,
  };
}

export interface SalesAnalyticsRow {
  id: string;
  domain: string;
  sale_price: number;
  purchase_price: number | null;
  sold_at: string;
  platform: string | null;
  buyer: string | null;
  notes: string | null;
  created_at: string | null;
}

export async function fetchSalesAnalytics(): Promise<SalesAnalyticsRow[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("sales")
    .select(`
      id,
      sale_price,
      sold_at,
      platform,
      buyer,
      notes,
      domain_id,
      domains!inner (
        domain,
        purchase_price,
        created_at
      )
    `)
    .order("sold_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as unknown as Array<{
    id: string;
    sale_price: number;
    sold_at: string;
    platform: string | null;
    buyer: string | null;
    notes: string | null;
    domain_id: string;
    domains: { domain: string; purchase_price: number | null; created_at: string } | null;
  }>).map((s) => ({
    id: s.id,
    domain: s.domains?.domain ?? "",
    sale_price: s.sale_price,
    purchase_price: s.domains?.purchase_price ?? null,
    sold_at: s.sold_at,
    platform: s.platform,
    buyer: s.buyer,
    notes: s.notes,
    created_at: s.domains?.created_at ?? null,
  }));
}
