import * as React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

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
  return (
    <section
      className={cn(
        "rounded-2xl bg-bg-surface p-6 text-text-primary shadow-card ring-1 ring-border/50",
        className
      )}
      {...props}
    >
      <header className="mb-5 flex items-center justify-between gap-3">
        <div className="min-w-0">
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
