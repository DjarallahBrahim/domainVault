"use client";

import type { TldCheckResult } from "@/lib/tld/types";
import { CheckCircle, Globe, AlertCircle, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function StatusIcon({ status }: { status: TldCheckResult["status"] }) {
  switch (status) {
    case "available":
      return <CheckCircle className="h-5 w-5 text-accent-success" />;
    case "registered":
      return <Globe className="h-5 w-5 text-accent-warning" />;
    case "reserved":
      return <Globe className="h-5 w-5 text-accent-primary" />;
    case "error":
      return <AlertCircle className="h-5 w-5 text-accent-danger" />;
  }
}

function StatusLabel({ status }: { status: TldCheckResult["status"] }) {
  const labels: Record<TldCheckResult["status"], string> = {
    available: "Available",
    registered: "Registered",
    reserved: "Reserved",
    error: "Error",
  };
  const colors: Record<TldCheckResult["status"], string> = {
    available: "text-accent-success",
    registered: "text-accent-warning",
    reserved: "text-accent-primary",
    error: "text-accent-danger",
  };
  return (
    <span className={`text-sm font-medium capitalize ${colors[status]}`}>
      {labels[status]}
    </span>
  );
}

export function SkeletonRow() {
  return (
    <TableRow>
      <TableCell className="w-10">
        <Skeleton className="h-5 w-5 rounded-full" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-40" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-16" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-4 w-12 ml-auto" />
      </TableCell>
    </TableRow>
  );
}

interface ResultsTableProps {
  results: TldCheckResult[];
  isLoading: boolean;
}

export function ResultsTable({ results, isLoading }: ResultsTableProps) {
  const showSkeletons = isLoading && results.length === 0;

  if (!isLoading && results.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-bg-surface/50 p-8 text-center">
        <p className="text-sm text-muted-foreground font-mono">
          Enter words and select TLDs to check availability
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead className="font-mono text-xs">Domain</TableHead>
              <TableHead className="font-mono text-xs">Status</TableHead>
              <TableHead className="font-mono text-xs text-right">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {showSkeletons
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              : results.map((r) => (
                  <TableRow key={r.domain}>
                    <TableCell className="w-10">
                      <StatusIcon status={r.status} />
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      <a
                        href={`https://${r.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        {r.domain}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell>
                      <StatusLabel status={r.status} />
                      {r.error && (
                        <span className="block text-xs text-muted-foreground mt-0.5">
                          {r.error}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground text-right">
                      {r.tookMs !== undefined ? `${r.tookMs}ms` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
