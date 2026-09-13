"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useCountUp } from "@/components/ui/stat-value";

export type StatAccent = "primary" | "success" | "warning" | "danger";

const accentText: Record<StatAccent, string> = {
  primary: "text-accent-primary",
  success: "text-accent-success",
  warning: "text-accent-warning",
  danger: "text-accent-danger",
};

const chipTint: Record<StatAccent, string> = {
  primary: "bg-accent-primary/12 text-accent-primary ring-accent-primary/20",
  success: "bg-accent-success/12 text-accent-success ring-accent-success/20",
  warning: "bg-accent-warning/12 text-accent-warning ring-accent-warning/20",
  danger: "bg-accent-danger/12 text-accent-danger ring-accent-danger/20",
};

export interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  accent?: StatAccent;
  prefix?: string;
  suffix?: string;
  sub?: string | null;
  href?: string;
  loading?: boolean;
  masked?: boolean;
  size?: "lg" | "md";
  className?: string;
  valueClassName?: string;
}

/**
 * StatCard — a labeled stat with a tinted, coloured icon chip and coloured
 * tabular figure. Used for the global KPI row and the month snapshot.
 */
function StatCard({
  label,
  value,
  icon: Icon,
  accent = "primary",
  prefix,
  suffix,
  sub,
  href,
  loading = false,
  masked = false,
  size = "lg",
  className,
  valueClassName,
}: StatCardProps) {
  const display = useCountUp(value, !loading);
  const numCls = size === "lg" ? "text-2xl xl:text-[1.75rem]" : "text-xl xl:text-2xl";
  const valueText = `${prefix ?? ""}${Math.round(display).toLocaleString("en-US")}${suffix ?? ""}`;

  const body = (
    <div
      className={cn(
        "flex h-full flex-col justify-between gap-4 rounded-2xl bg-bg-surface p-5 shadow-card ring-1 ring-border/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-raised",
        "hover:ring-2",
        cn(
          accent === "primary" && "hover:ring-accent-primary/25",
          accent === "success" && "hover:ring-accent-success/25",
          accent === "warning" && "hover:ring-accent-warning/25",
          accent === "danger" && "hover:ring-accent-danger/25"
        ),
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-text-muted">{label}</p>
          <div className="mt-1.5 min-h-[2rem]">
            {loading ? (
              <Skeleton className={cn(numCls, "h-8 w-20")} />
            ) : (
              <p
                className={cn(
                  "font-semibold tabular-nums tracking-tight transition-[filter] duration-200",
                  accentText[accent],
                  valueClassName,
                  numCls,
                  "leading-none",
                  masked && "select-none blur-[8px]"
                )}
              >
                {valueText}
              </p>
            )}
            {sub && !loading ? (
              <p className="mt-1.5 truncate text-xs font-normal text-text-muted">{sub}</p>
            ) : null}
          </div>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-xl p-2.5 ring-1 ring-inset",
            chipTint[accent]
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          "block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl",
          className
        )}
      >
        {body}
      </Link>
    );
  }

  return <div className={cn("h-full", className)}>{body}</div>;
}

export { StatCard };
