"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const rules = [
  { label: "At least 8 characters", test: (value: string) => value.length >= 8 },
  { label: "Contains a number", test: (value: string) => /[0-9]/.test(value) },
];

/**
 * Live password rules. Shown while the user is choosing a password and
 * removed once every rule passes, so the form doesn't carry dead weight.
 */
export function PasswordRequirements({ value }: { value: string }) {
  if (rules.every((rule) => rule.test(value))) return null;

  return (
    <ul className="mt-2 space-y-1.5" aria-live="polite">
      {rules.map((rule) => {
        const met = rule.test(value);
        return (
          <li
            key={rule.label}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-colors",
              met ? "text-accent-success" : "text-text-muted"
            )}
          >
            <span
              className={cn(
                "flex h-3.5 w-3.5 items-center justify-center rounded-full",
                met ? "bg-accent-success/15" : "bg-bg-elevated"
              )}
            >
              <Check
                className={cn("h-2.5 w-2.5", !met && "opacity-30")}
                strokeWidth={3}
                aria-hidden="true"
              />
            </span>
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
