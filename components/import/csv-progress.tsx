"use client";

import { Loader2 } from "lucide-react";

interface CsvProgressProps {
  phase: "idle" | "parsing" | "importing" | "complete";
  parsedRows?: number;
  currentRow?: number;
  totalRows?: number;
}

export function CsvProgress({
  phase,
  parsedRows = 0,
  currentRow = 0,
  totalRows = 0,
}: CsvProgressProps) {
  if (phase === "idle") return null;

  const progress =
    totalRows > 0 ? Math.round((currentRow / totalRows) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {(phase === "parsing" || phase === "importing") && (
          <Loader2 className="h-4 w-4 animate-spin text-accent-primary" />
        )}
        <span className="text-sm text-text-primary">
          {phase === "parsing" && `Parsing CSV... ${parsedRows} rows found`}
          {phase === "importing" &&
            `Importing to database... ${currentRow} of ${totalRows} rows`}
          {phase === "complete" && "Import complete"}
        </span>
      </div>
      {phase === "importing" && totalRows > 0 && (
        <div className="w-full bg-bg-elevated rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-accent-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
