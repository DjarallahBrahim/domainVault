import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DomainStatusBadge } from "@/components/domains/domain-status-badge";
import type { Database } from "@/types/supabase";

type DomainRow = Database["public"]["Tables"]["domains"]["Row"];

function daysSinceExpiry(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  return Math.ceil((now.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
}

interface DashboardExpiredTableProps {
  domains: DomainRow[];
}

export function DashboardExpiredTable({ domains }: DashboardExpiredTableProps) {
  if (!domains.length) {
    return (
      <div className="text-center py-8 text-sm text-text-muted">
        No expired domains.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-accent-danger/20">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Domain</TableHead>
            <TableHead>TLD</TableHead>
            <TableHead>Days Since Expiry</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {domains.map((domain) => {
            const days = daysSinceExpiry(domain.expiration_date);
            return (
              <TableRow key={domain.id}>
                <TableCell>
                  <Link
                    href={`/domains/${domain.id}`}
                    className="font-mono text-sm text-accent-primary hover:underline"
                  >
                    {domain.domain}
                  </Link>
                </TableCell>
                <TableCell className="text-xs text-text-muted">
                  .{domain.tld}
                </TableCell>
                <TableCell>
                  <span className="text-sm text-accent-danger font-medium">
                    {days} {days === 1 ? "day" : "days"} ago
                  </span>
                </TableCell>
                <TableCell>
                  <DomainStatusBadge status={domain.status} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
