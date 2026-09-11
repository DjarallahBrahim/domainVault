"use client";

import { Globe, Banknote, Clock, TrendingUp, Gem } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { useSensitiveVisibility } from "@/components/dashboard/sensitive-visibility";
import type { DashboardStats } from "@/lib/supabase/queries/dashboard-client";

interface DashboardGlobalStatsProps {
  stats: DashboardStats | null;
}

export function DashboardGlobalStats({ stats }: DashboardGlobalStatsProps) {
  const loading = stats === null;
  const { hidden } = useSensitiveVisibility();

  const cards = [
    {
      key: "total_active",
      label: "Total Domains",
      icon: Globe,
      accent: "primary" as const,
      value: stats?.total_active ?? 0,
      href: "/domains",
      sensitive: true,
    },
    {
      key: "portfolio_value",
      label: "Portfolio Value",
      icon: Gem,
      accent: "success" as const,
      prefix: "$",
      value: stats?.portfolio_value ?? 0,
      sensitive: true,
    },
    {
      key: "total_sales",
      label: "Lifetime Revenue",
      icon: Banknote,
      accent: "primary" as const,
      prefix: "$",
      value: stats?.total_sales ?? 0,
      sensitive: true,
    },
    {
      key: "expiring_90d",
      label: "Expiring in 90 Days",
      icon: Clock,
      accent: "warning" as const,
      value: stats?.expiring_90d ?? 0,
      sub: stats && stats.expiring_90d_all > 0 ? `of ${stats.expiring_90d_all}` : null,
      href: "/domains?expiry=3m",
      sensitive: false,
    },
    {
      key: "sold_this_year",
      label: "Sold This Year",
      icon: TrendingUp,
      accent: "danger" as const,
      value: stats?.sold_this_year ?? 0,
      href: "/sales",
      sensitive: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
      {cards.map((card) => (
        <StatCard
          key={card.key}
          label={card.label}
          icon={card.icon}
          accent={card.accent}
          prefix={card.prefix}
          value={card.value}
          sub={card.sub}
          href={card.href}
          loading={loading}
          masked={hidden && card.sensitive === true}
        />
      ))}
    </div>
  );
}
