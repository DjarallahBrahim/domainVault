import Link from "next/link";
import { FileUp } from "lucide-react";

export function DashboardEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-6 rounded-2xl bg-bg-surface p-5 shadow-card ring-1 ring-border/50">
        <FileUp className="h-10 w-10 text-text-muted" />
      </div>
      <h2 className="mb-2 text-section text-text-primary">No domains yet</h2>
      <p className="mb-7 max-w-sm text-[15px] leading-relaxed text-text-muted">
        Import your domain portfolio from a CSV file to see your dashboard analytics, expiration
        timeline, and portfolio value.
      </p>
      <Link
        href="/import"
        className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-6 py-3 text-sm font-medium text-white shadow-raised transition-all duration-150 hover:bg-accent-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]"
      >
        <FileUp className="h-5 w-5" />
        Import Your First CSV
      </Link>
    </div>
  );
}
