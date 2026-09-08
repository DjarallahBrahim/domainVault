import Link from "next/link";
import { FileUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DomainEmptyStateProps {
  onAddDomain?: () => void;
}

export function DomainEmptyState({ onAddDomain }: DomainEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-5 rounded-2xl bg-bg-surface p-4 shadow-card ring-1 ring-border/50">
        <FileUp className="h-8 w-8 text-text-muted" />
      </div>
      <h2 className="text-section mb-2 text-text-primary">No domains yet</h2>
      <p className="text-sm text-text-muted max-w-sm mb-6">
        Import your domain portfolio from a CSV file or add your first domain manually.
      </p>
      <div className="flex items-center gap-3">
        <Link
          href="/import"
          className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-5 py-2.5 text-sm font-medium text-white shadow-raised transition-all duration-150 hover:bg-accent-primary/90 active:scale-[0.98]"
        >
          <FileUp className="h-4 w-4" />
          Import CSV
        </Link>
        {onAddDomain && (
          <Button variant="outline" onClick={onAddDomain}>
            <Plus className="h-4 w-4 mr-1" />
            Add your first domain
          </Button>
        )}
      </div>
    </div>
  );
}
