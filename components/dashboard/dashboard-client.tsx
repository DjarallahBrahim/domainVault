"use client";

import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { DashboardGlobalStats } from "@/components/dashboard/dashboard-global-stats";
import { DashboardMonthSnapshot } from "@/components/dashboard/dashboard-month-snapshot";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
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

      <motion.div variants={fadeUp(0.1)} initial="hidden" animate="visible">
        <DashboardLayout
          data={{
            stats: stats ?? null,
            segments: segments ?? null,
            expiringDomains: expiringDomains ?? null,
            quickStats: quickStatsData ?? null,
          }}
        />
      </motion.div>
    </div>
  );
}
