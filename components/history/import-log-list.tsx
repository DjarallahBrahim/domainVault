"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { ImportLogDetail } from "@/components/history/import-log-detail";
import { queryKeys } from "@/lib/query-keys";
import { fetchImportLogs } from "@/lib/supabase/queries/import-logs-client";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronRight } from "lucide-react";

export function ImportLogList() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: logs, isLoading } = useQuery({
    queryKey: queryKeys.importLogs.lists(),
    queryFn: () => fetchImportLogs(),
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-12">
          <p className="text-text-muted">
            No imports yet — upload a CSV to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead>Filename</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Imported</TableHead>
            <TableHead className="text-right">Skipped</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <>
              <TableRow
                key={log.id}
                className="cursor-pointer hover:bg-bg-elevated"
                onClick={() =>
                  setExpandedId(expandedId === log.id ? null : log.id)
                }
              >
                <TableCell>
                  {expandedId === log.id ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </TableCell>
                <TableCell className="font-medium">{log.filename}</TableCell>
                <TableCell className="text-sm text-text-muted">
                  {new Date(log.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right text-sm">
                  {log.total_rows}
                </TableCell>
                <TableCell className="text-right text-sm text-accent-success">
                  {log.imported}
                </TableCell>
                <TableCell className="text-right text-sm text-accent-warning">
                  {log.skipped}
                </TableCell>
              </TableRow>
              {expandedId === log.id && (
                <TableRow>
                  <TableCell colSpan={6} className="bg-bg-surface">
                    <ImportLogDetail log={log} />
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
