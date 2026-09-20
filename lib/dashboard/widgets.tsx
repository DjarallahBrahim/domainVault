"use client";

import type { ReactNode } from "react";
import { DashboardExpiryDonut } from "@/components/dashboard/dashboard-expiry-donut";
import { DashboardCriticalRenewals } from "@/components/dashboard/dashboard-critical-renewals";
import { PromotionSection } from "@/components/dashboard/dashboard-promotion-section";
import { DashboardQuickStats } from "@/components/dashboard/dashboard-quick-stats";
import { DashboardRevenueChart } from "@/components/dashboard/dashboard-revenue-chart";
import { DashboardSpendSoldChart } from "@/components/dashboard/dashboard-spend-sold-chart";
import { DashboardSalesLeaderboard } from "@/components/dashboard/dashboard-sales-leaderboard";
import { DashboardPlatformBreakdown } from "@/components/dashboard/dashboard-platform-breakdown";
import { DashboardSalesTypeDonut } from "@/components/dashboard/dashboard-sales-type-donut";
import type {
  DashboardStats,
  ExpirySegments,
  fetchQuickStats,
} from "@/lib/supabase/queries/dashboard-client";
import type { Database } from "@/types/supabase";

type DomainRow = Database["public"]["Tables"]["domains"]["Row"];

export interface DashboardWidgetData {
  stats: DashboardStats | null;
  segments: ExpirySegments | null;
  expiringDomains: DomainRow[] | null;
  quickStats: Awaited<ReturnType<typeof fetchQuickStats>> | null;
}

export type WidgetId =
  | "expiry"
  | "renewals"
  | "promotion"
  | "quickstats"
  | "revenue"
  | "spend"
  | "sales"
  | "platforms"
  | "salestype-donut";

export interface WidgetDef {
  id: WidgetId;
  title: string;
  /** Responsive grid column span on the 6-column desktop grid. */
  span: string;
  render: (data: DashboardWidgetData) => ReactNode;
}

export const WIDGETS: Record<WidgetId, WidgetDef> = {
  expiry: {
    id: "expiry",
    title: "Expiry Overview",
    span: "lg:col-span-3",
    render: (d) => <DashboardExpiryDonut segments={d.segments} />,
  },
  renewals: {
    id: "renewals",
    title: "Critical Renewals",
    span: "lg:col-span-3",
    render: (d) => <DashboardCriticalRenewals domains={d.expiringDomains} />,
  },
  promotion: {
    id: "promotion",
    title: "Domains to Promote",
    span: "lg:col-span-3",
    render: () => <PromotionSection />,
  },
  quickstats: {
    id: "quickstats",
    title: "Quick Stats",
    span: "lg:col-span-3",
    render: (d) => <DashboardQuickStats stats={d.quickStats} />,
  },
  revenue: {
    id: "revenue",
    title: "Revenue Over Time",
    span: "lg:col-span-6",
    render: () => <DashboardRevenueChart />,
  },
  spend: {
    id: "spend",
    title: "Spend vs Sold",
    span: "lg:col-span-6",
    render: () => <DashboardSpendSoldChart />,
  },
  sales: {
    id: "sales",
    title: "Top Sales",
    span: "lg:col-span-3",
    render: () => <DashboardSalesLeaderboard />,
  },
  platforms: {
    id: "platforms",
    title: "Platform Performance",
    span: "lg:col-span-3",
    render: () => <DashboardPlatformBreakdown />,
  },
  "salestype-donut": {
    id: "salestype-donut",
    title: "Sales by Type",
    span: "lg:col-span-3",
    render: () => <DashboardSalesTypeDonut />,
  },
};

export const DEFAULT_ORDER: WidgetId[] = [
  "expiry",
  "renewals",
  "promotion",
  "quickstats",
  "revenue",
  "spend",
  "sales",
  "platforms",
  "salestype-donut",
];

const WIDGET_IDS = new Set<string>(Object.keys(WIDGETS));

/**
 * Reconcile a persisted order with the current registry: drop unknown ids,
 * de-duplicate, and append any newly-added widgets in their default position.
 */
export function mergeOrder(stored: unknown): WidgetId[] {
  const incoming = Array.isArray(stored)
    ? stored.filter((id): id is WidgetId => typeof id === "string" && WIDGET_IDS.has(id))
    : [];
  const seen = new Set<WidgetId>(incoming);
  const missing = DEFAULT_ORDER.filter((id) => !seen.has(id));
  return [...incoming, ...missing];
}
