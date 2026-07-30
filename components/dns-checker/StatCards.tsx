"use client";

import { cn } from "@/lib/utils";
import {
  ShieldCheck,
  ShieldX,
  Activity,
} from "lucide-react";
import { Card } from "@/components/ui/card";

type FilterValue = "all" | "dns_ok" | "no_dns";

interface StatCardsProps {
  counts: { all: number; dns_ok: number; no_dns: number };
  filter: FilterValue;
  onFilterChange: (f: FilterValue) => void;
}

const STATS: {
  key: FilterValue;
  label: string;
  icon: typeof Activity;
  getValue: (c: StatCardsProps["counts"]) => number;
}[] = [
  {
    key: "all",
    label: "Total",
    icon: Activity,
    getValue: (c) => c.all,
  },
  {
    key: "dns_ok",
    label: "DNS OK",
    icon: ShieldCheck,
    getValue: (c) => c.dns_ok,
  },
  {
    key: "no_dns",
    label: "No DNS",
    icon: ShieldX,
    getValue: (c) => c.no_dns,
  },
];

export function StatCards({
  counts,
  filter,
  onFilterChange,
}: StatCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {STATS.map((stat) => {
        const isActive = filter === stat.key;
        const value = stat.getValue(counts);

        const iconColors =
          stat.key === "dns_ok"
            ? "text-accent-success"
            : stat.key === "no_dns"
              ? "text-accent-danger"
              : "text-accent-primary";

        const iconBg =
          stat.key === "dns_ok"
            ? "bg-accent-success/10"
            : stat.key === "no_dns"
              ? "bg-accent-danger/10"
              : "bg-accent-primary/10";

        return (
          <button
            key={stat.key}
            type="button"
            onClick={() => onFilterChange(stat.key)}
            className="text-left"
          >
            <Card
              className={cn(
                "p-4 transition-colors cursor-pointer hover:bg-bg-elevated",
                isActive &&
                  stat.key === "dns_ok" &&
                  "ring-1 ring-accent-success/30",
                isActive &&
                  stat.key === "no_dns" &&
                  "ring-1 ring-accent-danger/30",
                isActive &&
                  stat.key === "all" &&
                  "ring-1 ring-accent-primary/30"
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-md shrink-0",
                    iconBg
                  )}
                >
                  <stat.icon className={cn("h-4 w-4", iconColors)} />
                </div>
                <div>
                  <div className="text-2xl font-mono font-semibold tabular-nums">
                    {value}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {stat.label}
                  </div>
                </div>
              </div>
            </Card>
          </button>
        );
      })}
    </div>
  );
}
