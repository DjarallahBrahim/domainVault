import { createClient } from "@/lib/supabase/client";
import { addMonths, format } from "date-fns";
import type { Database } from "@/types/supabase";

type DomainRow = Database["public"]["Tables"]["domains"]["Row"];
type DomainRenewalRow = DomainRow & { to_be_renewal: boolean | null };

export async function updatePromotion(promotionId: string, updates: { promoted_at: string }) {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("promotions")
    .update({ promoted_at: updates.promoted_at } as never)
    .eq("id", promotionId)
    .eq("user_id", user.id)
    .select("id, promoted_at");

  if (error) throw error;

  if (!data || data.length === 0) {
    throw new Error("Update blocked — you may not own this promotion");
  }

  return data;
}

export async function generatePromotionBatch(pool: string) {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) throw new Error("Not authenticated");

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weekStartStr = weekStart.toISOString().split("T")[0];

  let query = supabase
    .from("domains")
    .select("id, domain, registrar, expiration_date")
    .eq("status", "active");

  const now = new Date();
  if (pool === "1m") {
    query = query.lte("expiration_date", addMonths(now, 1).toISOString().split("T")[0]);
  } else if (pool === "3m") {
    query = query.lte("expiration_date", addMonths(now, 3).toISOString().split("T")[0]);
  } else if (pool === "6m") {
    query = query.lte("expiration_date", addMonths(now, 6).toISOString().split("T")[0]);
  } else if (pool === "9m") {
    query = query.lte("expiration_date", addMonths(now, 9).toISOString().split("T")[0]);
  }

  const { data: domains, error } = await query;
  if (error) throw error;

  const rows = (domains ?? []) as unknown as Array<{
    id: string;
    domain: string;
    registrar: string | null;
    expiration_date: string;
  }>;

  if (rows.length < 10) return null;

  await supabase.from("promotions").delete().eq("user_id", user.id).eq("week_start", weekStartStr);

  const shuffled = [...rows].sort(() => Math.random() - 0.5).slice(0, 10);

  const { error: insertError } = await supabase.from("promotions").insert(
    shuffled.map((d) => ({
      user_id: user.id,
      domain_id: d.id,
      week_start: weekStartStr,
      promoted_at: null,
    })) as never
  );

  if (insertError) throw insertError;

  return { count: 10 };
}

export interface DashboardStats {
  total_active: number;
  portfolio_value: number;
  total_sales: number;
  expiring_90d: number;
  expiring_90d_all: number;
  expiring_30d: number;
  sold_this_year: number;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const supabase = createClient();
  const { data: domains, error } = await supabase
    .from("domains")
    .select("purchase_price, status, expiration_date, to_be_renewal");
  if (error) throw error;
  const { data: salesRaw, error: sErr } = await supabase
    .from("sales")
    .select("sold_at, sale_price");
  if (sErr) throw sErr;
  const sales = (salesRaw ?? []) as unknown as Array<{ sold_at: string; sale_price: number }>;
  const now = new Date();
  const yearStart = `${now.getFullYear()}-01-01`;
  const rows = (domains ?? []) as unknown as DomainRow[];
  const active = rows.filter((d) => d.status === "active") as unknown as DomainRenewalRow[];
  const in90d = active.filter((d) => {
    const diff = (new Date(d.expiration_date).getTime() - now.getTime()) / 86400000;
    return diff <= 90;
  });
  return {
    total_active: active.length,
    portfolio_value: active.reduce((sum, d) => sum + (d.purchase_price ?? 0), 0),
    total_sales: sales.reduce((sum, s) => sum + (s.sale_price ?? 0), 0),
    expiring_90d: in90d.filter((d) => d.to_be_renewal === null).length,
    expiring_90d_all: in90d.length,
    expiring_30d: active.filter((d) => {
      const diff = (new Date(d.expiration_date).getTime() - now.getTime()) / 86400000;
      return diff <= 30 && diff >= 0;
    }).length,
    sold_this_year: sales.filter((s) => s.sold_at >= yearStart).length,
  };
}

export interface ExpirySegments {
  exp_1m: number;
  exp_3m: number;
  exp_6m: number;
  exp_9m: number;
  exp_over_9m: number;
  total_active: number;
}

export async function fetchExpirySegments(): Promise<ExpirySegments> {
  const supabase = createClient();
  const { data, error } = await supabase.from("domains").select("expiration_date, status");
  if (error) throw error;
  const active = ((data ?? []) as unknown as DomainRow[]).filter((d) => d.status === "active");
  const total_active = active.length;
  const now = new Date();
  let e1 = 0,
    e3 = 0,
    e6 = 0,
    e9 = 0;
  for (const d of active) {
    const days = (new Date(d.expiration_date).getTime() - now.getTime()) / 86400000;
    if (days <= 30) e1++;
    else if (days <= 90) e3++;
    else if (days <= 180) e6++;
    else if (days <= 270) e9++;
  }
  const eOver = total_active - e1 - e3 - e6 - e9;
  return { exp_1m: e1, exp_3m: e3, exp_6m: e6, exp_9m: e9, exp_over_9m: eOver, total_active };
}

export interface SpendVsSoldPoint {
  month: string;
  spend: number;
  sold: number;
}

export interface MonthSnapshot {
  month: string;
  invested: number;
  acquiredCount: number;
  soldCount: number;
  revenue: number;
}

export async function fetchMonthSnapshot(): Promise<MonthSnapshot> {
  const supabase = createClient();

  const monthKey = format(new Date(), "yyyy-MM");
  const monthLabel = format(new Date(), "MMMM");

  const { data: domains, error: domainError } = await supabase
    .from("domains")
    .select("created_at, purchase_price");
  if (domainError) throw domainError;

  const { data: sales, error: salesError } = await supabase
    .from("sales")
    .select("sold_at, sale_price");
  if (salesError) throw salesError;

  let invested = 0;
  let acquiredCount = 0;
  for (const d of (domains ?? []) as unknown as Array<{
    created_at: string | null;
    purchase_price: number | null;
  }>) {
    if (d.created_at && d.created_at.slice(0, 7) === monthKey) {
      invested += d.purchase_price ?? 0;
      acquiredCount++;
    }
  }

  let revenue = 0;
  let soldCount = 0;
  for (const s of (sales ?? []) as unknown as Array<{
    sold_at: string | null;
    sale_price: number;
  }>) {
    if (s.sold_at && s.sold_at.slice(0, 7) === monthKey) {
      revenue += s.sale_price ?? 0;
      soldCount++;
    }
  }

  return { month: monthLabel, invested, acquiredCount, soldCount, revenue };
}

export async function fetchSpendVsSold(): Promise<SpendVsSoldPoint[]> {
  const supabase = createClient();

  const { data: domains, error: domainError } = await supabase
    .from("domains")
    .select("created_at, purchase_price");
  if (domainError) throw domainError;
  const { data: sales, error: salesError } = await supabase
    .from("sales")
    .select("sold_at, sale_price");
  if (salesError) throw salesError;

  const byMonth = new Map<string, { spend: number; sold: number }>();
  for (const d of (domains ?? []) as unknown as Array<{
    created_at: string | null;
    purchase_price: number | null;
  }>) {
    if (!d.created_at) continue;
    const key = d.created_at.slice(0, 7);
    const entry = byMonth.get(key) || { spend: 0, sold: 0 };
    entry.spend += d.purchase_price ?? 0;
    byMonth.set(key, entry);
  }
  for (const s of (sales ?? []) as unknown as Array<{ sold_at: string; sale_price: number }>) {
    if (!s.sold_at) continue;
    const key = s.sold_at.slice(0, 7);
    const entry = byMonth.get(key) || { spend: 0, sold: 0 };
    entry.sold += s.sale_price ?? 0;
    byMonth.set(key, entry);
  }

  return Array.from(byMonth.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, v]) => ({ month, spend: v.spend, sold: v.sold }));
}

export async function fetchExpiringDomains(limit = 10): Promise<DomainRow[]> {
  const supabase = createClient();
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 31)
    .toISOString()
    .split("T")[0];
  const { data, error } = await supabase
    .from("domains")
    .select("*")
    .eq("status", "active")
    .lte("expiration_date", end)
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
  const supabase = createClient();
  const { data, error } = await supabase.from("domains").select("*");
  if (error) throw error;
  const rows = (data ?? []) as unknown as DomainRow[];
  const active = rows.filter((d) => d.status === "active");
  const prices = active.map((d) => d.purchase_price ?? 0).filter((p) => p > 0);
  const avg = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  const map = new Map<string, number>();
  for (const d of active) {
    const k = d.registrar?.trim() || "Unknown";
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  let topReg = "Unknown";
  let max = 0;
  for (const [k, c] of map) {
    if (c > max) {
      max = c;
      topReg = k;
    }
  }
  const sorted = [...active].sort(
    (a, b) => new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime()
  );
  const { data: salesRaw } = await supabase.from("sales").select("sale_price");
  const sales = (salesRaw ?? []) as unknown as Array<{ sale_price: number }>;
  return {
    avg_price: Math.round(avg * 100) / 100,
    most_common_registrar: topReg,
    oldest_domain: sorted.length > 0 ? sorted[0].domain : "—",
    newest_domain: sorted.length > 0 ? sorted[sorted.length - 1].domain : "—",
    total_expired: rows.filter((d) => d.status === "expired").length,
    total_earnings: sales.reduce((sum, s) => sum + (s.sale_price ?? 0), 0),
  };
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
  total_promotions: number;
  last_promoted_at: string | null;
}

export async function fetchCurrentPromotions(): Promise<PromotionWithDomain[]> {
  const supabase = createClient();

  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const weekStart = monday.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("promotions")
    .select(
      `
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
    `
    )
    .eq("week_start", weekStart)
    .order("domain_id");

  if (error) throw error;

  const rows = (data ?? []) as unknown as Array<{
    id: string;
    user_id: string;
    domain_id: string;
    week_start: string;
    promoted_at: string | null;
    domains: { domain: string; registrar: string | null; expiration_date: string } | null;
  }>;

  if (rows.length === 0) return [];

  const domainIds = rows.map((r) => r.domain_id);

  const { data: history, error: histError } = await supabase
    .from("promotions")
    .select("domain_id, promoted_at")
    .in("domain_id", domainIds)
    .not("promoted_at", "is", null)
    .order("promoted_at", { ascending: false });

  if (histError) throw histError;

  const historyByDomain = new Map<string, { count: number; last: string | null }>();
  for (const h of (history ?? []) as unknown as Array<{
    domain_id: string;
    promoted_at: string | null;
  }>) {
    const entry = historyByDomain.get(h.domain_id) || { count: 0, last: null };
    entry.count++;
    if (h.promoted_at && (!entry.last || h.promoted_at > entry.last)) {
      entry.last = h.promoted_at;
    }
    historyByDomain.set(h.domain_id, entry);
  }

  return rows.map((r) => {
    const hist = historyByDomain.get(r.domain_id);
    return {
      id: r.id,
      user_id: r.user_id,
      domain_id: r.domain_id,
      week_start: r.week_start,
      promoted_at: r.promoted_at,
      domain: r.domains?.domain ?? "",
      registrar: r.domains?.registrar ?? null,
      expiration_date: r.domains?.expiration_date ?? "",
      total_promotions: hist?.count ?? 0,
      last_promoted_at: hist?.last ?? null,
    };
  });
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
  const supabase = createClient();

  const { data, error } = await supabase
    .from("sales")
    .select(
      `
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
    `
    )
    .order("sold_at", { ascending: false });

  if (error) throw error;

  return (
    (data ?? []) as unknown as Array<{
      id: string;
      sale_price: number;
      sold_at: string;
      platform: string | null;
      buyer: string | null;
      notes: string | null;
      domain_id: string;
      domains: { domain: string; purchase_price: number | null; created_at: string } | null;
    }>
  ).map((s) => ({
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
