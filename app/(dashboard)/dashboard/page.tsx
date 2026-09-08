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

export const metadata: Metadata = {
  title: "Dashboard",
};

const dateLabel = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
}).format(new Date());

function PageHeader() {
  return (
    <div className="mb-8">
      <h1 className="text-large-title text-text-primary">Dashboard</h1>
      <p className="mt-1 text-sm text-text-muted">{dateLabel}</p>
    </div>
  );
}

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
      <div>
        <PageHeader />
        <DashboardEmptyState />
      </div>
    );
  }

  return (
    <div>
      <PageHeader />
      <DashboardClient
        initialStats={stats}
        initialSegments={segments}
        initialExpiringDomains={expiringDomains}
        initialQuickStats={quickStatsData}
      />
    </div>
  );
}
