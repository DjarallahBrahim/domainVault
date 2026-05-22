import { DollarSign } from "lucide-react";

export function SalesEmptyState({ onLogSale }: { onLogSale: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-bg-elevated p-4 mb-4">
        <DollarSign className="h-8 w-8 text-text-muted" />
      </div>
      <h2 className="text-lg font-semibold text-text-primary mb-2">
        No sales logged yet
      </h2>
      <p className="text-sm text-text-muted max-w-sm mb-4">
        Log your first domain sale to start tracking your earnings, revenue,
        and sales history.
      </p>
      <button
        onClick={onLogSale}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-accent-primary text-white text-sm font-medium hover:bg-accent-primary/90 transition-colors"
      >
        <DollarSign className="h-4 w-4" />
        Log Your First Sale
      </button>
    </div>
  );
}
