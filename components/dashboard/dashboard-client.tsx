"use client";

import { useQuery } from "@tanstack/react-query";
import { DashboardKpiCards } from "@/components/dashboard/dashboard-kpi-cards";
import { DashboardExpiryDonut } from "@/components/dashboard/dashboard-expiry-donut";
import { DashboardRegistrarChart } from "@/components/dashboard/dashboard-registrar-chart";
import { DashboardCriticalRenewals } from "@/components/dashboard/dashboard-critical-renewals";
import { DashboardPromotionTable } from "@/components/dashboard/dashboard-promotion-table";
import { DashboardQuickStats } from "@/components/dashboard/dashboard-quick-stats";
import {
  fetchDashboardStats,
  fetchExpirySegments,
  fetchRegistrarBreakdown,
  fetchExpiringDomains,
  fetchQuickStats,
  type DashboardStats,
  type ExpirySegments,
  type RegistrarBreakdown,
} from "@/lib/supabase/queries/dashboard-client";
import type { Database } from "@/types/supabase";

type DomainRow = Database["public"]["Tables"]["domains"]["Row"];

interface DashboardClientProps {
  initialStats: DashboardStats | null;
  initialSegments: ExpirySegments | null;
  initialRegistrarData: RegistrarBreakdown[] | null;
  initialExpiringDomains: DomainRow[] | null;
  initialQuickStats: Awaited<ReturnType<typeof fetchQuickStats>> | null;
}

export function DashboardClient({
  initialStats,
  initialSegments,
  initialRegistrarData,
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

  const { data: registrarData } = useQuery({
    queryKey: ["dashboard", "registrar"],
    queryFn: fetchRegistrarBreakdown,
    initialData: initialRegistrarData,
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DashboardExpiryDonut segments={segments ?? null} />
            <DashboardRegistrarChart data={registrarData ?? null} />
          </div>
          <DashboardPromotionTable />
        </div>
        <div className="space-y-6">
          <DashboardCriticalRenewals domains={expiringDomains ?? null} />
          <DashboardQuickStats stats={quickStatsData ?? null} />
        </div>
      </div>
    </div>
  );
}
