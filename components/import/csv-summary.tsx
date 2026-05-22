"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, SkipForward } from "lucide-react";
import type { ImportError } from "@/lib/supabase/queries/import-logs-client";

interface CsvSummaryProps {
  filename: string;
  imported: number;
  skipped: number;
  errors: ImportError[];
}

export function CsvSummary({
  filename,
  imported,
  skipped,
  errors,
}: CsvSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Import Results: {filename}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2 p-3 rounded-md bg-accent-success/10">
            <CheckCircle2 className="h-5 w-5 text-accent-success" />
            <div>
              <p className="text-2xl font-bold text-accent-success">
                {imported}
              </p>
              <p className="text-xs text-text-muted">Imported</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-md bg-accent-warning/10">
            <SkipForward className="h-5 w-5 text-accent-warning" />
            <div>
              <p className="text-2xl font-bold text-accent-warning">
                {skipped}
              </p>
              <p className="text-xs text-text-muted">Skipped</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-md bg-accent-danger/10">
            <AlertTriangle className="h-5 w-5 text-accent-danger" />
            <div>
              <p className="text-2xl font-bold text-accent-danger">
                {errors.length}
              </p>
              <p className="text-xs text-text-muted">Errors</p>
            </div>
          </div>
        </div>

        {errors.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-text-primary">
              Error Details
            </p>
            <div className="max-h-48 overflow-y-auto space-y-1 border border-border rounded-md p-3 bg-bg-elevated">
              {errors.map((err, i) => (
                <div
                  key={i}
                  className="text-xs text-text-muted flex gap-2 py-0.5"
                >
                  <span className="text-accent-danger font-mono shrink-0">
                    Row {err.row}
                  </span>
                  <span className="text-text-muted">-</span>
                  <span>{err.message}</span>
                  {err.field && (
                    <span className="text-text-muted/50">({err.field})</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
