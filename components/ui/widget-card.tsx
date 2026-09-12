"use client";

import * as React from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useDragHandle } from "@/components/dashboard/drag-handle-context";

export interface WidgetCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  /** Right-aligned header action (Segmented, link, refresh…). */
  action?: React.ReactNode;
  /** Show a standardized skeleton body instead of children. */
  loading?: boolean;
  /** Custom skeleton body (defaults to a generic block). */
  loadingSkeleton?: React.ReactNode;
  /** Show a standardized empty message instead of children. */
  empty?: boolean;
  emptyMessage?: string;
}

/**
 * WidgetCard — the shared Apple-style section shell. Header carries the title
 * + optional action; body supports built-in loading and empty states so
 * widgets stop re-implementing wrapper + title across three branches.
 */
function WidgetCard({
  title,
  description,
  action,
  loading = false,
  loadingSkeleton,
  empty = false,
  emptyMessage = "No data yet",
  className,
  children,
  ...props
}: WidgetCardProps) {
  const dragHandle = useDragHandle();

  return (
    <section
      className={cn(
        "rounded-2xl bg-bg-surface p-6 text-text-primary shadow-card ring-1 ring-border/50",
        className
      )}
      {...props}
    >
      <header className="mb-5 flex items-center gap-3">
        {dragHandle ? (
          <button
            ref={dragHandle.setActivatorNodeRef}
            {...dragHandle.listeners}
            {...dragHandle.attributes}
            type="button"
            aria-label="Drag to reorder"
            className="-ml-1.5 flex h-7 w-5 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-text-muted/50 transition-colors hover:bg-foreground/5 hover:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        ) : null}
        <div className="min-w-0 flex-1">
          <h3 className="text-card-title text-text-primary">{title}</h3>
          {description && <p className="mt-0.5 truncate text-sm text-text-muted">{description}</p>}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>

      {loading ? (
        (loadingSkeleton ?? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))
      ) : empty ? (
        <p className="py-6 text-center text-sm text-text-muted">{emptyMessage}</p>
      ) : (
        children
      )}
    </section>
  );
}

export { WidgetCard };
