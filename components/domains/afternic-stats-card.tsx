"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart3, Eye, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAfternicListings } from "@/lib/hooks/useAfternicListings";

interface AfternicStatsCardProps {
  domainId: string;
  domainName: string;
}

interface StatsResponse {
  data?: {
    days: number;
    totals: { views: number; leads: number };
  };
  error?: string;
}

export function AfternicStatsCard({ domainId, domainName }: AfternicStatsCardProps) {
  const { listings } = useAfternicListings();
  const listing = listings.get(domainId);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["afternic-stats", domainId],
    enabled: Boolean(listing),
    queryFn: async (): Promise<StatsResponse> => {
      const response = await fetch(
        `/api/afternic/stats?domain=${encodeURIComponent(domainName)}&days=30`
      );
      const body = (await response.json().catch(() => ({}))) as StatsResponse;
      if (!response.ok) throw new Error(body.error ?? "Could not load stats");
      return body;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (!listing) return null;

  const totals = data?.data?.totals;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4 text-accent-primary" />
          Afternic · last 30 days
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="h-14 animate-pulse rounded-lg bg-bg-elevated" />
            <div className="h-14 animate-pulse rounded-lg bg-bg-elevated" />
          </div>
        ) : isError ? (
          <p className="text-sm text-text-muted">Afternic stats are unavailable right now.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border p-3">
              <div className="flex items-center gap-1.5 text-xs text-text-muted">
                <Eye className="h-3.5 w-3.5" />
                Views
              </div>
              <p className="mt-1 font-mono text-xl font-semibold tabular-nums">
                {(totals?.views ?? 0).toLocaleString("en-US")}
              </p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <div className="flex items-center gap-1.5 text-xs text-text-muted">
                <Mail className="h-3.5 w-3.5" />
                Leads
              </div>
              <p className="mt-1 font-mono text-xl font-semibold tabular-nums">
                {(totals?.leads ?? 0).toLocaleString("en-US")}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
