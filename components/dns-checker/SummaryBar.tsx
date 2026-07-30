"use client";

import { cn } from "@/lib/utils";

type FilterValue = "all" | "dns_ok" | "no_dns";

interface SummaryBarProps {
  filter: FilterValue;
  onFilterChange: (filter: FilterValue) => void;
  counts: { all: number; dns_ok: number; no_dns: number };
}

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "dns_ok", label: "DNS OK" },
  { value: "no_dns", label: "No DNS" },
];

export function SummaryBar({
  filter,
  onFilterChange,
  counts,
}: SummaryBarProps) {
  return (
    <div className="flex items-center gap-1.5">
      {FILTERS.map((def) => {
        const isActive = filter === def.value;
        const count = counts[def.value];

        return (
          <button
            key={def.value}
            type="button"
            onClick={() => onFilterChange(def.value)}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono border transition-colors",
              isActive
                ? def.value === "dns_ok"
                  ? "bg-accent-success/10 border-accent-success/30 text-accent-success"
                  : def.value === "no_dns"
                    ? "bg-accent-danger/10 border-accent-danger/30 text-accent-danger"
                    : "bg-bg-elevated border-border text-text-primary"
                : "border-transparent text-muted-foreground hover:text-text-primary hover:bg-bg-elevated"
            )}
          >
            {def.label}
            <span className="opacity-60">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
