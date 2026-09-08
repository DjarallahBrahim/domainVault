"use client";

import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { DashboardGlobalStats } from "@/components/dashboard/dashboard-global-stats";
import { DashboardMonthSnapshot } from "@/components/dashboard/dashboard-month-snapshot";
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
import { fadeUp } from "@/lib/motion";
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
      <motion.div variants={fadeUp(0)} initial="hidden" animate="visible">
        <DashboardGlobalStats stats={stats ?? null} />
      </motion.div>

      <motion.div variants={fadeUp(0.05)} initial="hidden" animate="visible">
        <DashboardMonthSnapshot />
      </motion.div>

      <motion.div
        variants={fadeUp(0.1)}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-6 lg:grid-cols-3"
      >
        <div className="space-y-6 lg:col-span-2">
          <DashboardExpiryDonut segments={segments ?? null} />
          <PromotionSection />
        </div>
        <div className="space-y-6">
          <DashboardCriticalRenewals domains={expiringDomains ?? null} />
          <DashboardQuickStats stats={quickStatsData ?? null} />
        </div>
      </motion.div>

      <motion.div variants={fadeUp(0.1)} initial="hidden" animate="visible">
        <DashboardRevenueChart />
      </motion.div>

      <motion.div variants={fadeUp(0.15)} initial="hidden" animate="visible">
        <DashboardSpendSoldChart />
      </motion.div>

      <motion.div
        variants={fadeUp(0.2)}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-6 lg:grid-cols-2"
      >
        <DashboardSalesLeaderboard />
        <DashboardPlatformBreakdown />
      </motion.div>
    </div>
  );
}
