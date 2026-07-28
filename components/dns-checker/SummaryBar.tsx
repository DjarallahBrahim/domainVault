"use client";

import { Button } from "@/components/ui/button";

type FilterValue = "all" | "dns_ok" | "no_dns";

interface SummaryBarProps {
  filter: FilterValue;
  onFilterChange: (filter: FilterValue) => void;
  counts: { all: number; dns_ok: number; no_dns: number };
}

const FILTER_DEFS: { value: FilterValue; label: string }[] = [
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
    <div className="flex items-center gap-2 flex-wrap">
      {FILTER_DEFS.map((def) => (
        <Button
          key={def.value}
          type="button"
          variant={filter === def.value ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange(def.value)}
          className="text-xs"
        >
          {def.label}
          <span className="ml-1.5 opacity-60">
            ({counts[def.value]})
          </span>
        </Button>
      ))}
    </div>
  );
}
