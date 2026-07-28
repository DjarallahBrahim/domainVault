"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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
    <div className="flex items-center gap-2">
      <Checkbox
        id="compare-providers"
        checked={enabled}
        onCheckedChange={(checked) => onChange(checked === true)}
        disabled={disabled}
      />
      <Label
        htmlFor="compare-providers"
        className="text-sm cursor-pointer select-none"
      >
        Compare Providers
      </Label>
    </div>
  );
}
