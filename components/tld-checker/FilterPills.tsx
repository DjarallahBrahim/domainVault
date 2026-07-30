"use client";

import { cn } from "@/lib/utils";

type FilterValue = "all" | "available" | "registered" | "reserved" | "error";

interface TldCounts {
  available: number;
  registered: number;
  reserved: number;
  error: number;
}

interface FilterPillsProps {
  filter: FilterValue;
  onFilterChange: (f: FilterValue) => void;
  counts: TldCounts & { all: number };
}

const pills: Array<{
  key: FilterValue;
  label: string;
}> = [
  { key: "all", label: "All" },
  { key: "available", label: "Available" },
  { key: "registered", label: "Registered" },
  { key: "error", label: "Error" },
];

function pillColor(active: boolean, pillKey: FilterValue): string {
  if (!active) return "border-border text-muted-foreground hover:border-muted-foreground";

  switch (pillKey) {
    case "available":
      return "bg-accent-success/10 border-accent-success text-accent-success";
    case "registered":
      return "bg-accent-warning/10 border-accent-warning text-accent-warning";
    case "error":
      return "bg-accent-danger/10 border-accent-danger text-accent-danger";
    default:
      return "bg-accent-primary/10 border-accent-primary text-accent-primary";
  }
}

export function FilterPills({ filter, onFilterChange, counts }: FilterPillsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {pills.map((pill) => {
        const isActive = filter === pill.key;
        const count =
          pill.key === "all"
            ? counts.all
            : counts[pill.key as keyof TldCounts];

        return (
          <button
            key={pill.key}
            type="button"
            onClick={() => onFilterChange(pill.key)}
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-mono border transition-colors",
              pillColor(isActive, pill.key)
            )}
          >
            {pill.label}
            {count > 0 && (
              <span className="ml-1 opacity-60">({count})</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
