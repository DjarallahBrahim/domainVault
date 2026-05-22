import Link from "next/link";
import { FileUp } from "lucide-react";

export function DomainEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-bg-elevated p-4 mb-4">
        <FileUp className="h-8 w-8 text-text-muted" />
      </div>
      <h2 className="text-lg font-semibold text-text-primary mb-2">
        No domains yet
      </h2>
      <p className="text-sm text-text-muted max-w-sm mb-4">
        Import your domain portfolio from a CSV file to get started. You can
        manage, filter, and track your domains here.
      </p>
      <Link
        href="/import"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-accent-primary text-white text-sm font-medium hover:bg-accent-primary/90 transition-colors"
      >
        <FileUp className="h-4 w-4" />
        Import CSV
      </Link>
    </div>
  );
}
