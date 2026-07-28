"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { DnsResult } from "@/lib/dns/resolve";
import {
  CheckCircle,
  XCircle,
  Copy,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { useState, useCallback } from "react";

type FilterValue = "all" | "dns_ok" | "no_dns";

interface ComparisonResult {
  domain: string;
  cloudflare: DnsResult;
  google: DnsResult;
  mismatch: boolean;
}

interface ResultsTableProps {
  results: (DnsResult | null)[];
  filter: FilterValue;
  compareMode?: boolean;
  compareResults?: (ComparisonResult | null)[];
}

function CopyChip({ ip }: { ip: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(ip);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // Clipboard API unavailable — silently ignore
    }
  }, [ip]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 cursor-pointer group"
      title={copied ? "Copied!" : "Click to copy"}
    >
      <Badge
        variant="secondary"
        className="font-mono text-xs group-hover:bg-accent transition-colors"
      >
        {ip}
        <Copy className="ml-1 h-3 w-3 opacity-40 group-hover:opacity-100" />
      </Badge>
    </button>
  );
}

function ResultRow({ result }: { result: DnsResult | null }) {
  if (!result) {
    return <SkeletonRow />;
  }

  return (
    <TableRow>
      <TableCell className="w-10">
        {result.status === "ok" ? (
          <CheckCircle className="h-5 w-5 text-accent-success" />
        ) : (
          <XCircle className="h-5 w-5 text-muted-foreground" />
        )}
      </TableCell>
      <TableCell className="font-mono text-sm">
        <a
          href={`https://${result.domain}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:underline"
        >
          {result.domain}
          <ExternalLink className="h-3 w-3" />
        </a>
        {result.error && (
          <span className="block text-xs text-muted-foreground mt-0.5">
            {result.error}
          </span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {result.ips.length > 0 ? (
            result.ips.map((ip) => <CopyChip key={ip} ip={ip} />)
          ) : (
            <span className="text-sm text-muted-foreground">
              {result.status === "no_dns" ? "No A records" : "—"}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground capitalize">
        {result.resolver}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground text-right">
        {result.tookMs !== undefined ? `${result.tookMs}ms` : "—"}
      </TableCell>
    </TableRow>
  );
}

function CompareResultRow({
  result,
}: {
  result: ComparisonResult | null;
}) {
  if (!result) {
    return (
      <TableRow>
        <TableCell className="w-10">
          <Skeleton className="h-5 w-5 rounded-full" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-48" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 w-32" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 w-32" />
        </TableCell>
      </TableRow>
    );
  }

  const { cloudflare: cf, google: gg } = result;

  return (
    <TableRow
      className={result.mismatch ? "bg-accent-warning/5" : undefined}
    >
      <TableCell className="w-10">
        {result.mismatch ? (
            <AlertTriangle className="h-5 w-5 text-accent-warning" />
        ) : (
          <CheckCircle className="h-5 w-5 text-accent-success" />
        )}
      </TableCell>
      <TableCell className="font-mono text-sm">
        <a
          href={`https://${result.domain}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:underline"
        >
          {result.domain}
          <ExternalLink className="h-3 w-3" />
        </a>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {cf.ips.length > 0 ? (
            cf.ips.map((ip) => <CopyChip key={ip} ip={ip} />)
          ) : (
            <span className="text-sm text-muted-foreground">
              {cf.status === "no_dns" ? "No A records" : "—"}
            </span>
          )}
        </div>
        {cf.error && (
          <span className="block text-xs text-muted-foreground mt-0.5">
            {cf.error}
          </span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {gg.ips.length > 0 ? (
            gg.ips.map((ip) => <CopyChip key={ip} ip={ip} />)
          ) : (
            <span className="text-sm text-muted-foreground">
              {gg.status === "no_dns" ? "No A records" : "—"}
            </span>
          )}
        </div>
        {gg.error && (
          <span className="block text-xs text-muted-foreground mt-0.5">
            {gg.error}
          </span>
        )}
      </TableCell>
    </TableRow>
  );
}

function SkeletonRow() {
  return (
    <TableRow>
      <TableCell className="w-10">
        <Skeleton className="h-5 w-5 rounded-full" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-48" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-32" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-20" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-12 ml-auto" />
      </TableCell>
    </TableRow>
  );
}

function EmptyState({ filter }: { filter: FilterValue }) {
  if (filter !== "all") {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">No matching results</p>
        <p className="text-xs mt-1">
          Try switching to a different filter
        </p>
      </div>
    );
  }

  return (
    <div className="text-center py-12 text-muted-foreground">
      <p className="text-sm">
        Enter domains above and click Resolve to see results
      </p>
    </div>
  );
}

export function ResultsTable({
  results,
  filter,
  compareMode,
  compareResults,
}: ResultsTableProps) {
  if (compareMode && compareResults) {
    const hasResults = compareResults.length > 0;

    return (
      <div className="rounded-md border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">Match</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Cloudflare IPs</TableHead>
                <TableHead>Google IPs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hasResults ? (
                compareResults.map((result, i) => (
                  <CompareResultRow
                    key={result?.domain ?? `pending-${i}`}
                    result={result}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="p-0">
                    <EmptyState filter="all" />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  const hasResults = results.length > 0;

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">Status</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>IP Addresses</TableHead>
              <TableHead>Resolver</TableHead>
              <TableHead className="text-right">Latency</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hasResults ? (
              results.map((result, i) => (
                <ResultRow
                  key={result?.domain ?? `pending-${i}`}
                  result={result}
                />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="p-0">
                  <EmptyState filter={filter} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
