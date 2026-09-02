"use client";

import * as React from "react";
import { ExternalLink } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ReplyStatusSelect } from "./ReplyStatusSelect";
import { cn } from "@/lib/utils";
import type { OutreachRow, ReplyStatus, ReservedTld } from "@/types/promoting";

const REPLY_RANK: Record<ReplyStatus, number> = {
  positive: 0,
  pending: 1,
  negative: 2,
};

interface ReservedTldTableProps {
  tlds: ReservedTld[];
  outreach: Map<string, OutreachRow>;
  isLoading: boolean;
  onToggleContacted: (tld: string, next: boolean) => void;
  onSetReply: (tld: string, status: ReplyStatus) => void;
}

export function ReservedTldTable({
  tlds,
  outreach,
  isLoading,
  onToggleContacted,
  onSetReply,
}: ReservedTldTableProps) {
  const [sortBy, setSortBy] = React.useState<"tld" | "reply">("tld");

  const rows = React.useMemo(() => {
    if (sortBy === "reply") {
      return [...tlds].sort(
        (a, b) =>
          REPLY_RANK[outreach.get(a.tld)?.reply_status ?? "pending"] -
          REPLY_RANK[outreach.get(b.tld)?.reply_status ?? "pending"]
      );
    }
    return [...tlds].sort((a, b) => a.tld.localeCompare(b.tld));
  }, [tlds, outreach, sortBy]);

  return (
    <div className="mx-auto w-full max-w-xl overflow-x-auto rounded-lg border border-border bg-bg-surface">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="cursor-pointer select-none" onClick={() => setSortBy("tld")}>
              TLD
              {sortBy === "tld" && <span className="ml-1 text-text-muted">↓</span>}
            </TableHead>
            <TableHead className="w-32">Contacted</TableHead>
            <TableHead
              className="w-40 cursor-pointer select-none"
              onClick={() => setSortBy("reply")}
            >
              Reply
              {sortBy === "reply" && <span className="ml-1 text-text-muted">↓</span>}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-6" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-24" />
                  </TableCell>
                </TableRow>
              ))
            : rows.map((tld) => {
                const row = outreach.get(tld.tld);
                const contacted = row?.contacted ?? false;
                const replyStatus = row?.reply_status ?? "pending";
                return (
                  <TableRow key={tld.tld}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "h-2 w-2 shrink-0 rounded-full",
                            tld.isLive ? "bg-accent-success" : "bg-text-muted/50"
                          )}
                          title={tld.isLive ? "Live (has DNS)" : "Not live"}
                        />
                        <a
                          href={`https://${tld.fullDomain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-sm text-accent-primary hover:underline inline-flex items-center gap-1"
                        >
                          {tld.fullDomain}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={contacted}
                        onCheckedChange={(checked) => onToggleContacted(tld.tld, checked === true)}
                        aria-label={`Mark ${tld.fullDomain} as contacted`}
                        className="border-border data-[state=checked]:border-accent-primary data-[state=checked]:bg-accent-primary data-[state=checked]:text-white"
                        title={
                          row?.contacted_at
                            ? `Contacted ${new Date(row.contacted_at).toLocaleString()}`
                            : "Mark as contacted"
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <ReplyStatusSelect
                        value={replyStatus}
                        disabled={!contacted}
                        onChange={(status) => onSetReply(tld.tld, status)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
        </TableBody>
      </Table>
    </div>
  );
}
