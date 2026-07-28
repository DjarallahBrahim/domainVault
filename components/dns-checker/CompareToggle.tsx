"use client";

import { Checkbox } from "@/components/ui/checkbox";

interface CompareToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled: boolean;
}

export function CompareToggle({
  enabled,
  onChange,
  disabled,
}: CompareToggleProps) {
  return (
    <label className="inline-flex items-center gap-1.5 cursor-pointer select-none text-xs font-mono text-muted-foreground">
      <Checkbox
        checked={enabled}
        onCheckedChange={(checked) => onChange(checked === true)}
        disabled={disabled}
        className="h-3.5 w-3.5"
      />
      compare both
    </label>
  );
}
