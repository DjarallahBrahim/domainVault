"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { springSnappy } from "@/lib/motion";

export interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

/**
 * Switch — a compact on/off toggle with a spring-driven knob. Fires on
 * pointer-down and animates from the current value, so it stays interruptible.
 */
export function Switch({ checked, onCheckedChange, className, disabled, ...props }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-accent-primary" : "bg-bg-elevated ring-1 ring-inset ring-border",
        className
      )}
      {...props}
    >
      <motion.span
        aria-hidden
        className="block h-5 w-5 rounded-full bg-white shadow-card"
        initial={false}
        animate={{ x: checked ? 22 : 2 }}
        transition={springSnappy}
      />
    </button>
  );
}
