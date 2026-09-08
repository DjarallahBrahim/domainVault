"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useMotionValue, useSpring, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export interface StatValueProps {
  label: string;
  value: number;
  format?: (n: number) => string;
  prefix?: string;
  sub?: string | null;
  href?: string;
  loading?: boolean;
  animate?: boolean;
  accent?: "primary" | "success" | "warning" | "danger" | null;
  className?: string;
  valueClassName?: string;
}

const accentText: Record<NonNullable<StatValueProps["accent"]>, string> = {
  primary: "text-accent-primary",
  success: "text-accent-success",
  warning: "text-accent-warning",
  danger: "text-accent-danger",
};

export function useCountUp(target: number, enabled: boolean): number {
  const reduced = useReducedMotion();
  const [display, setDisplay] = React.useState(target);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    stiffness: 150,
    damping: 24,
    mass: 1,
    restDelta: 0.5,
  });

  React.useEffect(() => {
    if (!enabled || reduced) {
      setDisplay(target);
      return;
    }
    // Start a fresh count from 0 the first time; animate from the current
    // value on subsequent updates (interruptible, velocity-aware).
    motionValue.set(0);
    const unsub = springValue.on("change", (v) => setDisplay(v));
    motionValue.set(target);
    return () => {
      unsub();
    };
  }, [target, enabled, reduced, motionValue, springValue]);

  return display;
}

/**
 * StatValue — a label + big tabular number (skill §15). Owns the spring
 * count-up and reduced-motion behaviour so KPI logic is never re-implemented.
 */
function StatValue({
  label,
  value,
  format,
  prefix,
  sub,
  href,
  loading = false,
  animate = true,
  accent = null,
  className,
  valueClassName,
}: StatValueProps) {
  const display = useCountUp(value, animate && !loading);
  const formatted = format
    ? format(Math.round(display))
    : Math.round(display).toLocaleString("en-US");

  const body = loading ? (
    <Skeleton className="h-9 w-20" />
  ) : (
    <span className="inline-flex items-baseline gap-2">
      <span
        className={cn(
          "font-semibold tabular-nums tracking-tight text-text-primary",
          accent && accentText[accent],
          valueClassName ?? "text-[2rem] leading-none"
        )}
      >
        {prefix}
        {formatted}
      </span>
      {sub ? <span className="text-sm font-normal text-text-muted">{sub}</span> : null}
    </span>
  );

  const shell = (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="min-w-0 space-y-1">
        <p className="truncate text-sm text-text-muted">{label}</p>
        {body}
      </div>
      {href ? <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-text-muted/60" /> : null}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
      >
        {shell}
      </Link>
    );
  }

  return shell;
}

export { StatValue };
