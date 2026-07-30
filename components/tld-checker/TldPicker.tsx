"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const DEFAULT_TLDS = ["com", "net", "org", "io", "ai", "co", "app", "dev"];

interface TldPickerProps {
  selectedTlds: string[];
  onToggleTld: (tld: string) => void;
  onAddCustomTld: (tld: string) => void;
  disabled: boolean;
}

export function TldPicker({
  selectedTlds,
  onToggleTld,
  onAddCustomTld,
  disabled,
}: TldPickerProps) {
  const [customValue, setCustomValue] = useState("");

  const handleAddCustom = () => {
    const trimmed = customValue.trim();
    if (trimmed) {
      onAddCustomTld(trimmed);
      setCustomValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCustom();
    }
  };

  const allTlds = [
    ...DEFAULT_TLDS,
    ...selectedTlds.filter((t) => !DEFAULT_TLDS.includes(t)),
  ];

  const seen = new Set<string>();

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {allTlds.map((tld) => {
        if (seen.has(tld)) return null;
        seen.add(tld);

        const sel = selectedTlds.includes(tld);
        return (
          <button
            key={tld}
            type="button"
            onClick={() => onToggleTld(tld)}
            disabled={disabled}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-mono border transition-colors",
              sel
                ? "bg-accent-primary/10 border-accent-primary text-accent-primary"
                : "border-border text-muted-foreground hover:border-muted-foreground",
              disabled && "opacity-40 cursor-not-allowed"
            )}
          >
            .{tld}
          </button>
        );
      })}
      <span className="text-xs text-muted-foreground/50 font-mono mx-1">
        +
      </span>
      <input
        type="text"
        value={customValue}
        onChange={(e) => setCustomValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="custom"
        disabled={disabled}
        className={cn(
          "w-16 bg-transparent border-b border-border text-xs font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:border-accent-primary transition-colors",
          disabled && "opacity-40 cursor-not-allowed"
        )}
      />
    </div>
  );
}
