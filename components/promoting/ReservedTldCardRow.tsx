"use client";

import { ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ReplyStatusSelect } from "./ReplyStatusSelect";
import { cn } from "@/lib/utils";
import type { OutreachRow, ReplyStatus, ReservedTld } from "@/types/promoting";

interface ReservedTldCardRowProps {
  tlds: ReservedTld[];
  outreach: Map<string, OutreachRow>;
  isLoading: boolean;
  onToggleContacted: (tld: string, next: boolean) => void;
  onSetReply: (tld: string, status: ReplyStatus) => void;
}

export function ReservedTldCardRow({
  tlds,
  outreach,
  isLoading,
  onToggleContacted,
  onSetReply,
}: ReservedTldCardRowProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-between p-4">
              <Skeleton className="h-4 w-32" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-6" />
                <Skeleton className="h-6 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tlds.map((tld) => {
        const row = outreach.get(tld.tld);
        const contacted = row?.contacted ?? false;
        const replyStatus = row?.reply_status ?? "pending";
        return (
          <Card key={tld.tld} className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div className="flex min-w-0 items-center gap-2">
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
                  className="truncate font-mono text-sm text-accent-primary hover:underline inline-flex items-center gap-1"
                >
                  {tld.fullDomain}
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              </div>
              <div className="flex shrink-0 items-center gap-3">
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
                <ReplyStatusSelect
                  value={replyStatus}
                  disabled={!contacted}
                  onChange={(status) => onSetReply(tld.tld, status)}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
