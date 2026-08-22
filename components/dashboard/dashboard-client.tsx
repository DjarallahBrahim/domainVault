"use client";

import { useQuery } from "@tanstack/react-query";
import { DashboardKpiCards } from "@/components/dashboard/dashboard-kpi-cards";
import { DashboardExpiryDonut } from "@/components/dashboard/dashboard-expiry-donut";
import { DashboardCriticalRenewals } from "@/components/dashboard/dashboard-critical-renewals";
import { PromotionSection } from "@/components/dashboard/dashboard-promotion-section";
import { DashboardQuickStats } from "@/components/dashboard/dashboard-quick-stats";
import { DashboardRevenueChart } from "@/components/dashboard/dashboard-revenue-chart";
import { DashboardSpendSoldChart } from "@/components/dashboard/dashboard-spend-sold-chart";
import { DashboardSalesLeaderboard } from "@/components/dashboard/dashboard-sales-leaderboard";
import { DashboardPlatformBreakdown } from "@/components/dashboard/dashboard-platform-breakdown";
import {
  fetchDashboardStats,
  fetchExpirySegments,
  fetchExpiringDomains,
  fetchQuickStats,
  type DashboardStats,
  type ExpirySegments,
} from "@/lib/supabase/queries/dashboard-client";
import type { Database } from "@/types/supabase";

type DomainRow = Database["public"]["Tables"]["domains"]["Row"];

interface DashboardClientProps {
  initialStats: DashboardStats | null;
  initialSegments: ExpirySegments | null;
  initialExpiringDomains: DomainRow[] | null;
  initialQuickStats: Awaited<ReturnType<typeof fetchQuickStats>> | null;
}

export function DashboardClient({
  initialStats,
  initialSegments,
  initialExpiringDomains,
  initialQuickStats,
}: DashboardClientProps) {
  const { data: stats } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: fetchDashboardStats,
    initialData: initialStats,
    staleTime: 10 * 1000,
  });

  const { data: segments } = useQuery({
    queryKey: ["dashboard", "segments"],
    queryFn: fetchExpirySegments,
    initialData: initialSegments,
    staleTime: 10 * 1000,
  });

  const { data: expiringDomains } = useQuery({
    queryKey: ["dashboard", "expiring"],
    queryFn: () => fetchExpiringDomains(10),
    initialData: initialExpiringDomains,
    staleTime: 10 * 1000,
  });

  const { data: quickStatsData } = useQuery({
    queryKey: ["dashboard", "quickstats"],
    queryFn: fetchQuickStats,
    initialData: initialQuickStats,
    staleTime: 10 * 1000,
  });

  return (
    <div className="space-y-6">
      <DashboardKpiCards stats={stats ?? null} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <DashboardExpiryDonut segments={segments ?? null} />
          <PromotionSection />
        </div>
        <div className="space-y-6">
          <DashboardCriticalRenewals domains={expiringDomains ?? null} />
          <DashboardQuickStats stats={quickStatsData ?? null} />
        </div>
      </div>

      <DashboardRevenueChart />

      <DashboardSpendSoldChart />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardSalesLeaderboard />
        <DashboardPlatformBreakdown />
      </div>
    </div>
  );
}
