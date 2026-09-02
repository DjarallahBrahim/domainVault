"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ReplyStatus } from "@/types/promoting";

const PILL_STYLES: Record<ReplyStatus, string> = {
  pending: "border-accent-warning/30 bg-accent-warning/10 text-accent-warning",
  positive: "border-accent-success/30 bg-accent-success/10 text-accent-success",
  negative: "border-accent-danger/30 bg-accent-danger/10 text-accent-danger",
};

interface ReplyStatusSelectProps {
  value: ReplyStatus;
  disabled?: boolean;
  onChange: (status: ReplyStatus) => void;
}

export function ReplyStatusSelect({ value, disabled = false, onChange }: ReplyStatusSelectProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        className={cn(
          "h-7 w-28 rounded-full px-2.5 text-xs font-medium transition-colors duration-200 border data-[state=open]:ring-1 data-[state=open]:ring-ring",
          PILL_STYLES[value],
          disabled ? "opacity-50 cursor-not-allowed" : "hover:brightness-110 cursor-pointer"
        )}
        title={disabled ? "Mark as contacted first" : undefined}
        aria-label="Reply status"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pending">Pending</SelectItem>
        <SelectItem value="positive">Positive</SelectItem>
        <SelectItem value="negative">Negative</SelectItem>
      </SelectContent>
    </Select>
  );
}
