"use client";

import { cn } from "@/lib/utils";

type FilterValue = "all" | "available" | "registered" | "reserved" | "error";

interface TldCounts {
  all: number;
  available: number;
  registered: number;
  reserved: number;
  error: number;
}

interface StatCardsProps {
  counts: TldCounts;
  filter: FilterValue;
  onFilterChange: (f: FilterValue) => void;
}

const cards: Array<{
  key: FilterValue;
  label: string;
  ring: string;
  bg: string;
}> = [
  {
    key: "all",
    label: "Total",
    ring: "ring-accent-primary",
    bg: "bg-accent-primary/5",
  },
  {
    key: "available",
    label: "Available",
    ring: "ring-accent-success",
    bg: "bg-accent-success/5",
  },
  {
    key: "registered",
    label: "Registered",
    ring: "ring-accent-warning",
    bg: "bg-accent-warning/5",
  },
  {
    key: "error",
    label: "Error",
    ring: "ring-accent-danger",
    bg: "bg-accent-danger/5",
  },
];

export function StatCards({ counts, filter, onFilterChange }: StatCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((card) => {
        const isActive = filter === card.key;
        const count = counts[card.key === "all" ? "all" : card.key];

        return (
          <button
            key={card.key}
            type="button"
            onClick={() => onFilterChange(card.key)}
            className={cn(
              "rounded-xl border p-4 text-left transition-all",
              isActive
                ? `border-border ${card.bg} ring-1 ${card.ring}`
                : "border-border bg-bg-surface/50 hover:bg-bg-elevated/50"
            )}
          >
            <div className="text-2xl font-mono font-semibold text-foreground">
              {count}
            </div>
            <div className="text-xs font-mono text-muted-foreground mt-0.5">
              {card.label}
            </div>
          </button>
        );
      })}
    </div>
  );
}
