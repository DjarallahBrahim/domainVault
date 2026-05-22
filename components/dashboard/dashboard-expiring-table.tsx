import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DomainExpiryBadge } from "@/components/domains/domain-expiry-badge";
import { DomainStatusBadge } from "@/components/domains/domain-status-badge";
import type { Database } from "@/types/supabase";

type DomainRow = Database["public"]["Tables"]["domains"]["Row"];

interface DashboardExpiringTableProps {
  domains: DomainRow[];
}

export function DashboardExpiringTable({ domains }: DashboardExpiringTableProps) {
  if (!domains.length) {
    return (
      <div className="text-center py-8 text-sm text-text-muted">
        No domains expiring soon — your portfolio is in good shape.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Domain</TableHead>
            <TableHead>TLD</TableHead>
            <TableHead>Expiration</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {domains.map((domain) => (
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
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    {new Date(domain.expiration_date).toLocaleDateString()}
                  </span>
                  <DomainExpiryBadge expirationDate={domain.expiration_date} />
                </div>
              </TableCell>
              <TableCell>
                <DomainStatusBadge status={domain.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
