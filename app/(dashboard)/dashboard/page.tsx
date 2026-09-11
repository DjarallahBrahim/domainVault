import type { Metadata } from "next";
import {
  autoTransitionExpired,
  fetchDashboardStats,
  fetchExpirySegments,
  fetchExpiringDomains,
  fetchQuickStats,
} from "@/lib/supabase/queries/dashboard";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SensitiveVisibilityProvider } from "@/components/dashboard/sensitive-visibility";

export const metadata: Metadata = {
  title: "Dashboard",
};

const dateLabel = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
}).format(new Date());

export default async function DashboardPage() {
  try {
    await autoTransitionExpired();
  } catch {
    // Auto-transition failure should not block dashboard load
  }

  const [stats, segments, expiringDomains, quickStatsData] = await Promise.all([
    fetchDashboardStats().catch(() => null),
    fetchExpirySegments().catch(() => null),
    fetchExpiringDomains(30).catch(() => null),
    fetchQuickStats().catch(() => null),
  ]);

  if (!stats || stats.total_active === 0) {
    return (
      <SensitiveVisibilityProvider>
        <DashboardHeader dateLabel={dateLabel} />
        <DashboardEmptyState />
      </SensitiveVisibilityProvider>
    );
  }

  return (
    <SensitiveVisibilityProvider>
      <DashboardHeader dateLabel={dateLabel} />
      <DashboardClient
        initialStats={stats}
        initialSegments={segments}
        initialExpiringDomains={expiringDomains}
        initialQuickStats={quickStatsData}
      />
    </SensitiveVisibilityProvider>
  );
}
