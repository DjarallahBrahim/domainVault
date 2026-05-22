import Link from "next/link";
import { FileUp } from "lucide-react";

export function DashboardEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="rounded-full bg-bg-elevated p-5 mb-4">
        <FileUp className="h-10 w-10 text-text-muted" />
      </div>
      <h2 className="text-xl font-semibold text-text-primary mb-2">
        No domains yet
      </h2>
      <p className="text-sm text-text-muted max-w-sm mb-6">
        Import your domain portfolio from a CSV file to see your dashboard
        analytics, expiration timeline, and portfolio value.
      </p>
      <Link
        href="/import"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-accent-primary text-white text-sm font-medium hover:bg-accent-primary/90 transition-colors"
      >
        <FileUp className="h-5 w-5" />
        Import Your First CSV
      </Link>
    </div>
  );
}
