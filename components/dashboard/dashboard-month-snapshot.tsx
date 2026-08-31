"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Wallet, ShoppingCart, Banknote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchMonthSnapshot } from "@/lib/supabase/queries/dashboard-client";

const CARD_CONFIG: Array<{
  key: "invested" | "soldCount" | "revenue";
  label: string;
  icon: typeof Wallet;
  prefix?: string;
  href?: string;
  gradient: string;
  border: string;
  iconColor: string;
}> = [
  {
    key: "invested",
    label: "Invested This Month",
    icon: Wallet,
    prefix: "$",
    href: "/domains?created=1m",
    gradient: "from-accent-primary/8 to-accent-primary/3",
    border: "border-l-accent-primary",
    iconColor: "text-accent-primary",
  },
  {
    key: "soldCount",
    label: "Sold This Month",
    icon: ShoppingCart,
    gradient: "from-accent-warning/8 to-accent-warning/3",
    border: "border-l-accent-warning",
    iconColor: "text-accent-warning",
  },
  {
    key: "revenue",
    label: "Revenue This Month",
    icon: Banknote,
    prefix: "$",
    gradient: "from-accent-success/8 to-accent-success/3",
    border: "border-l-accent-success",
    iconColor: "text-accent-success",
  },
];

export function DashboardMonthSnapshot() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "month-snapshot"],
    queryFn: fetchMonthSnapshot,
    staleTime: 10 * 1000,
  });

  const title = data
    ? `${data.month} Snapshot`
    : `${new Date().toLocaleString("en-US", { month: "long" })} Snapshot`;

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-bg-surface p-6">
        <h3 className="text-sm font-semibold mb-4">{title}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-border bg-bg-surface p-6">
        <h3 className="text-sm font-semibold mb-4">{title}</h3>
        <p className="text-sm text-text-muted py-4 text-center">Snapshot data unavailable</p>
      </div>
    );
  }

  const acquired = `${data.acquiredCount} domain${data.acquiredCount === 1 ? "" : "s"} acquired`;

  return (
    <div className="rounded-xl border border-border bg-bg-surface p-6">
      <h3 className="text-sm font-semibold mb-4">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {CARD_CONFIG.map((card) => {
          const value = data[card.key];
          const showSub = card.key === "invested";

          const cardEl = (
            <Card
              key={card.key}
              className={`relative overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:shadow-lg border-l-4 ${card.border} bg-gradient-to-br ${card.gradient}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-text-muted">{card.label}</p>
                    <p className="text-2xl lg:text-3xl font-bold font-display">
                      {card.prefix}
                      {value.toLocaleString("en-US")}
                    </p>
                    {showSub && <p className="text-sm font-medium text-text-primary">{acquired}</p>}
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
              {cardEl}
            </Link>
          ) : (
            <div key={card.key}>{cardEl}</div>
          );
        })}
      </div>
    </div>
  );
}
