"use client";

import { Eye, EyeOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useSensitiveVisibility } from "@/components/dashboard/sensitive-visibility";

interface DashboardHeaderProps {
  dateLabel: string;
}

export function DashboardHeader({ dateLabel }: DashboardHeaderProps) {
  const { hidden, toggle } = useSensitiveVisibility();

  return (
    <div className="mb-8">
      <h1 className="text-large-title text-text-primary">Dashboard</h1>
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
  );
}
