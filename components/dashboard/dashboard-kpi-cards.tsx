"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Globe, DollarSign, Clock, TrendingUp, TrendingDown, ShoppingCart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardStats } from "@/lib/supabase/queries/dashboard";

interface DashboardKpiCardsProps {
  stats: DashboardStats | null;
  prevStats?: DashboardStats | null;
}

function AnimatedCounter({ value, prefix }: { value: number; prefix?: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) {
      setDisplay(0);
      return;
    }
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

  return (
    <span>
      {prefix}
      {display.toLocaleString("en-US")}
    </span>
  );
}

function Trend({ current, previous }: { current: number; previous?: number }) {
  if (previous === undefined || previous === 0) return null;
  const diff = current - previous;
  if (diff === 0) return null;
  const isUp = diff > 0;
  const Icon = isUp ? TrendingUp : TrendingDown;
  const color = isUp ? "text-accent-success" : "text-accent-danger";
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${color}`}>
      <Icon className="h-3 w-3" />
      {isUp ? "+" : ""}
      {diff}
    </span>
  );
}

const CARD_CONFIG: Array<{
  key: keyof DashboardStats;
  label: string;
  icon: typeof Clock;
  href?: string;
  prefix?: string;
  subKey?: keyof DashboardStats;
  subLabel?: string;
  gradient: string;
  border: string;
  iconColor: string;
}> = [
  {
    key: "total_active" as const,
    label: "Total Domains",
    icon: Globe,
    href: "/domains",
    gradient: "from-accent-primary/8 to-accent-primary/3",
    border: "border-l-accent-primary",
    iconColor: "text-accent-primary",
  },
  {
    key: "portfolio_value" as const,
    label: "Portfolio Value",
    icon: DollarSign,
    prefix: "$",
    gradient: "from-accent-success/8 to-accent-success/3",
    border: "border-l-accent-success",
    iconColor: "text-accent-success",
  },
  {
    key: "total_sales" as const,
    label: "Total Sales",
    icon: ShoppingCart,
    prefix: "$",
    href: "/sales",
    gradient: "from-ring/10 to-ring/4",
    border: "border-l-ring",
    iconColor: "text-accent-primary",
  },
  {
    key: "expiring_90d" as const,
    label: "Expiring in 90 Days",
    subKey: "expiring_90d_all" as const,
    subLabel: "all expiring in 90d",
    icon: Clock,
    href: "/domains?expiry=3m",
    gradient: "from-accent-warning/8 to-accent-warning/3",
    border: "border-l-accent-warning",
    iconColor: "text-accent-warning",
  },
  {
    key: "sold_this_year" as const,
    label: "Sold This Year",
    icon: TrendingUp,
    href: "/sales",
    gradient: "from-accent-danger/8 to-accent-danger/3",
    border: "border-l-accent-danger",
    iconColor: "text-accent-danger",
  },
];

export function DashboardKpiCards({ stats, prevStats }: DashboardKpiCardsProps) {
  const isLoading = !stats;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {CARD_CONFIG.map((card) => {
        const value = stats?.[card.key] ?? 0;
        const prev = prevStats?.[card.key] ?? undefined;
        const prefix = card.prefix;
        const sub = card.subKey && stats ? (stats[card.subKey] ?? 0) : null;

        const content = (
          <Card
            className={`relative overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:shadow-lg border-l-4 ${card.border} bg-gradient-to-br ${card.gradient}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-text-muted">{card.label}</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl lg:text-3xl font-bold font-display">
                        <AnimatedCounter value={value} prefix={prefix} />
                        {sub !== null && (
                          <span
                            className="text-base font-normal text-text-muted"
                            title={card.subLabel}
                          >
                            {" "}
                            ({sub})
                          </span>
                        )}
                      </p>
                      <Trend current={value} previous={prev} />
                    </div>
                  )}
                </div>
                <div className="rounded-lg bg-bg-elevated p-2.5">
                  <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );

        return card.href ? (
          <Link key={card.key} href={card.href}>
            {content}
          </Link>
        ) : (
          <div key={card.key}>{content}</div>
        );
      })}
    </div>
  );
}
