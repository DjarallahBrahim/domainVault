"use client";

import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import type { SaleType } from "@/lib/constants/marketplaces";

interface SaleTypeCheckboxesProps {
  value: SaleType;
  onChange: (value: SaleType) => void;
  className?: string;
}

/**
 * Mutually exclusive Inbound / Outbound checkboxes. One is always selected,
 * so ticking the active option is a no-op rather than clearing the field.
 */
export function SaleTypeCheckboxes({
  value,
  onChange,
  className,
}: SaleTypeCheckboxesProps) {
  return (
    <div
      className={cn(
        "flex h-9 items-center gap-6 rounded-md border border-input px-3 text-sm",
        className
      )}
    >
      <label className="flex cursor-pointer select-none items-center gap-2">
        <Checkbox
          checked={value === "inbound"}
          onCheckedChange={(checked) => {
            if (checked) onChange("inbound");
          }}
        />
        <span>Inbound</span>
      </label>
      <label className="flex cursor-pointer select-none items-center gap-2">
        <Checkbox
          checked={value === "outbound"}
          onCheckedChange={(checked) => {
            if (checked) onChange("outbound");
          }}
        />
        <span>Outbound</span>
      </label>
    </div>
  );
}
