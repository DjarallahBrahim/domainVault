"use client";

import { Eye, EyeOff, RotateCcw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useSensitiveVisibility } from "@/components/dashboard/sensitive-visibility";
import { useDashboardLayout } from "@/lib/hooks/use-dashboard-layout";
import { DEFAULT_ORDER } from "@/lib/dashboard/widgets";

interface DashboardHeaderProps {
  dateLabel: string;
}

export function DashboardHeader({ dateLabel }: DashboardHeaderProps) {
  const { hidden, toggle } = useSensitiveVisibility();
  const { order, resetLayout } = useDashboardLayout();

  const isCustom = order.join(",") !== DEFAULT_ORDER.join(",");

  return (
    <div className="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-large-title text-text-primary">Portfolio Overview</h1>
        <div className="mt-1 flex items-center gap-3">
          <p className="text-sm text-text-muted">{dateLabel}</p>
          <label className="flex cursor-pointer select-none items-center gap-2 text-xs font-medium text-text-muted transition-colors hover:text-text-primary">
            <Switch
              checked={hidden}
              onCheckedChange={toggle}
              aria-label="Hide sensitive information"
            />
            {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {hidden ? "Show info" : "Hide info"}
          </label>
        </div>
      </div>
      {isCustom && (
        <button
          type="button"
          onClick={resetLayout}
          className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-foreground/5 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset layout
        </button>
      )}
    </div>
  );
}
