import type { Metadata } from "next";
import {
  autoTransitionExpired,
  fetchDomainsForDashboard,
} from "@/lib/supabase/queries/dashboard";
import { DashboardSummaryCards } from "@/components/dashboard/dashboard-summary-cards";
import { DashboardTldChart } from "@/components/dashboard/dashboard-tld-chart";
import { DashboardTimelineChart } from "@/components/dashboard/dashboard-timeline-chart";
import { DashboardValueChart } from "@/components/dashboard/dashboard-value-chart";
import { DashboardExpiringTable } from "@/components/dashboard/dashboard-expiring-table";
import { DashboardExpiredTable } from "@/components/dashboard/dashboard-expired-table";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Database } from "@/types/supabase";

type DomainRow = Database["public"]["Tables"]["domains"]["Row"];

export const metadata: Metadata = {
  title: "Dashboard",
};

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function daysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  return Math.ceil(
    (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function computeTldCounts(
  domains: DomainRow[]
): { tld: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const d of domains) {
    counts.set(d.tld, (counts.get(d.tld) ?? 0) + 1);
  }

  const result: { tld: string; count: number }[] = [];
  const otherTlds: { tld: string; count: number }[] = [];

  for (const [tld, count] of counts) {
    if (count < 3) {
      otherTlds.push({ tld, count });
    } else {
      result.push({ tld, count });
    }
  }

  if (otherTlds.length > 0) {
    const otherCount = otherTlds.reduce((sum, t) => sum + t.count, 0);
    result.push({ tld: "Other", count: otherCount });
  }

  result.sort((a, b) => b.count - a.count);
  return result;
}

function computeTimeline(domains: DomainRow[]) {
  const now = new Date();
  const monthly = new Array(12).fill(0);
  const labels: string[] = [];

  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    labels.push(MONTH_NAMES[d.getMonth()]);
  }

  for (const domain of domains) {
    const expDate = new Date(domain.expiration_date);
    if (expDate < now) continue;
    const monthDiff =
      (expDate.getFullYear() - now.getFullYear()) * 12 +
      (expDate.getMonth() - now.getMonth());
    if (monthDiff >= 0 && monthDiff < 12) {
      monthly[monthDiff]++;
    }
  }

  return labels
    .map((month, i) => ({ month, count: monthly[i] }))
    .filter((m) => m.count > 0);
}

function computeTldValues(
  domains: DomainRow[]
): { tld: string; value: number }[] {
  const values = new Map<string, number>();
  for (const d of domains) {
    if (d.purchase_price && d.purchase_price > 0) {
      values.set(d.tld, (values.get(d.tld) ?? 0) + d.purchase_price);
    }
  }

  const result = Array.from(values.entries()).map(([tld, value]) => ({
    tld,
    value,
  }));
  result.sort((a, b) => b.value - a.value);
  return result;
}

export default async function DashboardPage() {
  try {
    await autoTransitionExpired();
  } catch {
    // Auto-transition failure should not block dashboard load
  }

  const domains = await fetchDomainsForDashboard();

  if (!domains.length) {
    return (
      <div>
        <h1 className="text-2xl font-bold font-display mb-6">Dashboard</h1>
        <DashboardEmptyState />
      </div>
    );
  }

  const now = new Date();

  const total = domains.length;
  const active = domains.filter((d) => d.status === "active").length;
  const expiringSoon = domains.filter((d) => {
    if (d.status !== "active") return false;
    const days = daysUntil(d.expiration_date);
    return days > 0 && days <= 30;
  }).length;
  const portfolioValue = domains
    .filter((d) => d.purchase_price && d.purchase_price > 0)
    .reduce((sum, d) => sum + (d.purchase_price ?? 0), 0);

  const tldCounts = computeTldCounts(domains);
  const timeline = computeTimeline(domains);
  const tldValues = computeTldValues(domains);

  const expiringSoonDomains = domains
    .filter((d) => {
      if (d.status !== "active") return false;
      const days = daysUntil(d.expiration_date);
      return days > 0 && days <= 90;
    })
    .sort(
      (a, b) =>
        new Date(a.expiration_date).getTime() -
        new Date(b.expiration_date).getTime()
    );

  const expiredDomains = domains
    .filter(
      (d) =>
        new Date(d.expiration_date) < now &&
        (d.status === "expired" || d.status === "active")
    )
    .sort(
      (a, b) =>
        new Date(b.expiration_date).getTime() -
        new Date(a.expiration_date).getTime()
    );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-display">Dashboard</h1>

      <DashboardSummaryCards
        total={total}
        active={active}
        expiringSoon={expiringSoon}
        portfolioValue={portfolioValue}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">TLD Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardTldChart data={tldCounts} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Expiration Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardTimelineChart data={timeline} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Value by TLD</CardTitle>
        </CardHeader>
        <CardContent>
          <DashboardValueChart data={tldValues} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Expiring Soon (≤90 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardExpiringTable domains={expiringSoonDomains} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Expired Domains</CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardExpiredTable domains={expiredDomains} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
