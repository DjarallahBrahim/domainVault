"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ChartPayloadItem {
  name?: React.ReactNode;
  value?: number | string | Array<number | string>;
  color?: string;
  fill?: string;
  stroke?: string;
  dataKey?: string | number;
  payload?: Record<string, unknown>;
}

export interface ChartTooltipProps {
  active?: boolean;
  label?: React.ReactNode;
  payload?: ChartPayloadItem[];
  /** Reformat every row value, e.g. currency. */
  formatter?: (value: number | string, item: ChartPayloadItem) => React.ReactNode;
  /** Reformat the group label (axis category). */
  labelFormatter?: (label: React.ReactNode) => React.ReactNode;
  /** Optional header string rendered above the label. */
  header?: React.ReactNode;
  /** Static footer node, or a function over the first payload item. */
  footer?:
    | React.ReactNode
    | ((item: ChartPayloadItem) => React.ReactNode);
  className?: string;
}

/**
 * ChartTooltip — the single material tooltip used by every Recharts widget
 * (ADR-009). Resolves from CSS tokens so it works in light AND dark (fixes
 * the previous hard-coded dark tooltip that broke light mode).
 *
 * Use via: <Tooltip content={<ChartTooltip formatter={…} />} />
 */
function ChartTooltip({
  active,
  label,
  payload,
  formatter,
  labelFormatter,
  header,
  footer,
  className,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-bg-surface px-3.5 py-2.5 text-sm shadow-raised",
        className
      )}
    >
      {header ? (
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
          {header}
        </div>
      ) : null}
      {label !== undefined && label !== null ? (
        <p className="mb-1 text-xs font-medium text-text-muted">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      ) : null}
      <div className="space-y-1">
        {payload.map((item, index) => {
          const color = item.color ?? item.stroke ?? item.fill ?? "var(--text-muted)";
          const raw = item.value;
          const value = Array.isArray(raw) ? (raw[1] ?? raw[0]) : raw;
          return (
            <div key={index} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-text-muted">{item.name}</span>
              <span className="ml-auto font-medium tabular-nums text-text-primary">
                {formatter ? formatter(Number(value) || 0, item) : value}
              </span>
            </div>
          );
        })}
      </div>
      {footer ? (
        <div className="mt-1.5 border-t border-border/40 pt-1.5">
          {typeof footer === "function" ? footer(payload[0]) : footer}
        </div>
      ) : null}
    </div>
  );
}

export { ChartTooltip };
