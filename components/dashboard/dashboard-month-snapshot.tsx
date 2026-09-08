"use client";

import { useQuery } from "@tanstack/react-query";
import { Wallet, ShoppingCart, Banknote } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { fetchMonthSnapshot } from "@/lib/supabase/queries/dashboard-client";

export function DashboardMonthSnapshot() {
  const { data, isPending } = useQuery({
    queryKey: ["dashboard", "month-snapshot"],
    queryFn: fetchMonthSnapshot,
    staleTime: 10 * 1000,
  });

  const title = data?.month ?? "This month";

  const cells = [
    {
      key: "invested",
      label: "Invested",
      icon: Wallet,
      accent: "primary" as const,
      prefix: "$",
      value: data?.invested ?? 0,
      sub: data
        ? `${data.acquiredCount} domain${data.acquiredCount === 1 ? "" : "s"} acquired`
        : null,
    },
    {
      key: "soldCount",
      label: "Sold",
      icon: ShoppingCart,
      accent: "warning" as const,
      value: data?.soldCount ?? 0,
      sub: null,
    },
    {
      key: "revenue",
      label: "Revenue",
      icon: Banknote,
      accent: "success" as const,
      prefix: "$",
      value: data?.revenue ?? 0,
      sub: null,
    },
  ];

  return (
    <section className="rounded-3xl bg-bg-surface p-6 shadow-card ring-1 ring-border/50">
      <header className="mb-5">
        <h2 className="text-section text-text-primary">{title} Snapshot</h2>
      </header>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cells.map((cell) => (
          <StatCard
            key={cell.key}
            label={cell.label}
            icon={cell.icon}
            accent={cell.accent}
            prefix={cell.prefix}
            value={cell.value}
            sub={cell.sub}
            loading={isPending}
            size="md"
          />
        ))}
      </div>
    </section>
  );
}
