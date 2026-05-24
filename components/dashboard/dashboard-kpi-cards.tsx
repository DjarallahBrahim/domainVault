"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Globe, DollarSign, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardStats } from "@/lib/supabase/queries/dashboard";

interface DashboardKpiCardsProps {
  stats: DashboardStats | null;
}

function AnimatedCounter({ value, prefix }: { value: number; prefix?: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    const steps = 20;
    const increment = value / steps;
    let current = 0;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      current = Math.min(Math.round(increment * step), value);
      setDisplay(current);
      if (step >= steps) clearInterval(timer);
    }, 25);
    return () => clearInterval(timer);
  }, [value]);

  return <span>{prefix}{display.toLocaleString()}</span>;
}

function KpiCard({
  icon: Icon,
  label,
  value,
  href,
  accentColor,
  prefix,
  isLoading,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  href?: string;
  accentColor: string;
  prefix?: string;
  isLoading: boolean;
}) {
  const content = (
    <Card
      className={`relative overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:shadow-lg border-l-4 ${accentColor} ${href ? "cursor-pointer" : ""}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-text-muted">{label}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold font-display">
                <AnimatedCounter value={value} prefix={prefix} />
              </p>
            )}
          </div>
          <div className="rounded-lg bg-bg-elevated p-2">
            <Icon className="h-5 w-5 text-text-muted" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

export function DashboardKpiCards({ stats }: DashboardKpiCardsProps) {
  const isLoading = !stats;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        icon={Globe}
        label="Total Domains"
        value={stats?.total_active ?? 0}
        href="/domains"
        accentColor="border-l-accent-primary"
        isLoading={isLoading}
      />
      <KpiCard
        icon={DollarSign}
        label="Portfolio Value"
        value={stats?.portfolio_value ?? 0}
        prefix="$"
        accentColor="border-l-accent-success"
        isLoading={isLoading}
      />
      <KpiCard
        icon={Clock}
        label="Expiring in 90 Days"
        value={stats?.expiring_90d ?? 0}
        href="/domains?expiry=3m"
        accentColor="border-l-accent-warning"
        isLoading={isLoading}
      />
      <KpiCard
        icon={TrendingUp}
        label="Sold This Year"
        value={stats?.sold_this_year ?? 0}
        href="/sales"
        accentColor="border-l-accent-danger"
        isLoading={isLoading}
      />
    </div>
  );
}
