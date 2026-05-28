import type { Metadata } from "next";
import {
  autoTransitionExpired,
  fetchDashboardStats,
  fetchExpirySegments,
  fetchRegistrarBreakdown,
  fetchExpiringDomains,
  fetchQuickStats,
} from "@/lib/supabase/queries/dashboard";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  try {
    await autoTransitionExpired();
  } catch {
    // Auto-transition failure should not block dashboard load
  }

  const [stats, segments, registrarData, expiringDomains, quickStatsData] =
    await Promise.all([
      fetchDashboardStats().catch(() => null),
      fetchExpirySegments().catch(() => null),
      fetchRegistrarBreakdown().catch(() => null),
      fetchExpiringDomains(30).catch(() => null),
      fetchQuickStats().catch(() => null),
    ]);

  if (!stats || stats.total_active === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold font-display mb-6">Dashboard</h1>
        <DashboardEmptyState />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold font-display mb-6">Dashboard</h1>
      <DashboardClient
        initialStats={stats}
        initialSegments={segments}
        initialRegistrarData={registrarData}
        initialExpiringDomains={expiringDomains}
        initialQuickStats={quickStatsData}
      />
    </div>
  );
}
