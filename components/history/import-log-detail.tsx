import type { Database } from "@/types/supabase";

type ImportLogRow = Database["public"]["Tables"]["import_logs"]["Row"];

interface ImportLogDetailProps {
  log: ImportLogRow;
}

export function ImportLogDetail({ log }: ImportLogDetailProps) {
  const errors = Array.isArray(log.errors)
    ? (log.errors as unknown as Array<{
        row: number;
        field: string;
        message: string;
      }>)
    : [];

  if (errors.length === 0) {
    return (
      <div className="p-3 text-sm text-text-muted">
        No errors in this import.
      </div>
    );
  }

  return (
    <div className="p-3 space-y-1">
      {errors.map((err, i) => (
        <div key={i} className="flex items-start gap-2 text-xs">
          <span className="text-accent-danger font-mono shrink-0">
            Row {err.row}
          </span>
          <span className="text-text-muted">-</span>
          <span className="text-text-primary">{err.message}</span>
          {err.field && (
            <span className="text-text-muted/50">({err.field})</span>
          )}
        </div>
      ))}
    </div>
  );
}
