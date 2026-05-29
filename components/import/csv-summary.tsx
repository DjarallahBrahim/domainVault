"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, SkipForward, ChevronDown, ChevronUp } from "lucide-react";
import type { ImportError } from "@/lib/supabase/queries/import-logs-client";

interface CsvSummaryProps {
  filename: string;
  imported: number;
  skipped: number;
  skippedErrors: ImportError[];
  errors: ImportError[];
}

export function CsvSummary({
  filename,
  imported,
  skipped,
  skippedErrors,
  errors,
}: CsvSummaryProps) {
  const [showSkipped, setShowSkipped] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

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

          <div
            className={`flex items-center gap-2 p-3 rounded-md bg-accent-warning/10 ${skipped > 0 ? "cursor-pointer hover:bg-accent-warning/20 transition-colors" : ""}`}
            onClick={() => skipped > 0 && setShowSkipped(!showSkipped)}
          >
            <SkipForward className="h-5 w-5 text-accent-warning" />
            <div className="flex-1">
              <div className="flex items-center gap-1">
                <p className="text-2xl font-bold text-accent-warning">
                  {skipped}
                </p>
                {skipped > 0 && (
                  showSkipped ? (
                    <ChevronUp className="h-4 w-4 text-accent-warning/70" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-accent-warning/70" />
                  )
                )}
              </div>
              <p className="text-xs text-text-muted">
                Skipped{skipped > 0 ? " — click to see why" : ""}
              </p>
            </div>
          </div>

          <div
            className={`flex items-center gap-2 p-3 rounded-md bg-accent-danger/10 ${errors.length > 0 ? "cursor-pointer hover:bg-accent-danger/20 transition-colors" : ""}`}
            onClick={() => errors.length > 0 && setShowErrors(!showErrors)}
          >
            <AlertTriangle className="h-5 w-5 text-accent-danger" />
            <div className="flex-1">
              <div className="flex items-center gap-1">
                <p className="text-2xl font-bold text-accent-danger">
                  {errors.length}
                </p>
                {errors.length > 0 && (
                  showErrors ? (
                    <ChevronUp className="h-4 w-4 text-accent-danger/70" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-accent-danger/70" />
                  )
                )}
              </div>
              <p className="text-xs text-text-muted">
                Errors{errors.length > 0 ? " — click to see details" : ""}
              </p>
            </div>
          </div>
        </div>

        {showSkipped && skippedErrors.length > 0 && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <p className="text-sm font-medium text-accent-warning">
              Skipped Rows — these domains already exist in your portfolio
            </p>
            <div className="max-h-48 overflow-y-auto space-y-1 border border-accent-warning/20 rounded-md p-3 bg-accent-warning/5">
              {skippedErrors.map((err, i) => (
                <div
                  key={i}
                  className="text-xs flex gap-2 py-0.5"
                >
                  <span className="text-accent-warning font-mono shrink-0">
                    Row {err.row}
                  </span>
                  <span className="text-text-muted">-</span>
                  <span className="text-text-muted">{err.message.replace(/^Duplicate — /, "")}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {showErrors && errors.length > 0 && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <p className="text-sm font-medium text-accent-danger">
              Error Details
            </p>
            <div className="max-h-48 overflow-y-auto space-y-1 border border-accent-danger/20 rounded-md p-3 bg-accent-danger/5">
              {errors.map((err, i) => (
                <div
                  key={i}
                  className="text-xs flex gap-2 py-0.5"
                >
                  <span className="text-accent-danger font-mono shrink-0">
                    Row {err.row}
                  </span>
                  <span className="text-text-muted">-</span>
                  <span className="text-text-muted">{err.message}</span>
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
