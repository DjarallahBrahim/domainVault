"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ALLOWED_REGISTRARS } from "@/lib/registrars";

interface RegistrarAutocompleteProps {
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function RegistrarAutocomplete({
  id,
  value,
  onValueChange,
  placeholder = "godaddy, dynadot, spaceship...",
}: RegistrarAutocompleteProps) {
  const [open, setOpen] = useState(false);

  const matches = ALLOWED_REGISTRARS.filter((r) => r.toLowerCase().includes(value.toLowerCase()));
  const show = open && value.trim().length > 0 && matches.length > 0;

  return (
    <div className="relative">
      <Input
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
      />
      {show && (
        <div className="absolute z-10 w-full mt-1 bg-bg-elevated border border-border rounded-md shadow-lg max-h-40 overflow-y-auto">
          {matches.slice(0, 8).map((r) => (
            <button
              key={r}
              type="button"
              className="w-full text-left px-3 py-1.5 text-sm text-text-primary hover:bg-bg-surface"
              onMouseDown={() => {
                onValueChange(r);
                setOpen(false);
              }}
            >
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
