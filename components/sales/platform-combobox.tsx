"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  DOMAIN_MARKETPLACES,
  normalizePlatform,
} from "@/lib/constants/marketplaces";

interface PlatformComboboxProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Editable platform input with marketplace suggestions. Typing filters the
 * list (prefix matches first); Tab accepts the closest match, arrows navigate,
 * Enter selects and Escape closes. Free text is normalized on blur.
 */
export function PlatformCombobox({
  id,
  value,
  onChange,
  placeholder = "Start typing — e.g. Afternic",
  className,
}: PlatformComboboxProps) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);

  const suggestions = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) return [...DOMAIN_MARKETPLACES];
    const startsWith = DOMAIN_MARKETPLACES.filter((m) =>
      m.toLowerCase().startsWith(query)
    );
    const contains = DOMAIN_MARKETPLACES.filter(
      (m) => !m.toLowerCase().startsWith(query) && m.toLowerCase().includes(query)
    );
    return [...startsWith, ...contains];
  }, [value]);

  const choose = (next: string) => {
    onChange(next);
    setOpen(false);
    setHighlighted(0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlighted((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (open && suggestions[highlighted]) {
        e.preventDefault();
        choose(suggestions[highlighted]);
      }
    } else if (e.key === "Tab") {
      const match = suggestions[highlighted] ?? suggestions[0];
      if (open && match && match !== value) {
        e.preventDefault();
        choose(match);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Input
        id={id}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={id ? `${id}-suggestions` : undefined}
        aria-autocomplete="list"
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHighlighted(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        onBlur={(e) => {
          onChange(normalizePlatform(e.target.value));
          setOpen(false);
        }}
        maxLength={100}
      />
      {open && suggestions.length > 0 && (
        <ul
          id={id ? `${id}-suggestions` : undefined}
          role="listbox"
          className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {suggestions.map((suggestion, index) => (
            <li key={suggestion}>
              <button
                type="button"
                role="option"
                aria-selected={index === highlighted}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setHighlighted(index)}
                onClick={() => choose(suggestion)}
                className={cn(
                  "flex w-full items-center rounded-sm px-2 py-1.5 text-left text-sm",
                  index === highlighted
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                )}
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
