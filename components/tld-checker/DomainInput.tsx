"use client";

import { cn } from "@/lib/utils";

interface DomainInputProps {
  value: string;
  onChange: (value: string) => void;
  wordCount: number;
  error: string | null;
  disabled: boolean;
}

export function DomainInput({
  value,
  onChange,
  wordCount,
  error,
  disabled,
}: DomainInputProps) {
  return (
    <div className="space-y-1.5">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="mybrand, acmecorp, ..."
        disabled={disabled}
        rows={4}
        className={cn(
          "w-full resize-none bg-transparent font-mono text-sm placeholder:text-muted-foreground/50 focus:outline-none border-none p-0",
          disabled && "opacity-40 cursor-not-allowed"
        )}
      />
      <div className="flex items-center gap-2 text-xs font-mono">
        <span className="text-muted-foreground">&zwnj;</span>
        <span
          className={cn(
            "text-muted-foreground/70",
            error && "text-accent-danger"
          )}
        >
          {error
            ? error
            : wordCount > 0
              ? `${wordCount} word(s)`
              : "no words entered"}
        </span>
      </div>
    </div>
  );
}
