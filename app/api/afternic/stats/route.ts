import { NextRequest, NextResponse } from "next/server";
import { callAfternic } from "@/lib/afternic/client";
import { toAsciiDomain } from "@/lib/afternic/names";
import { afternicErrorResponse, authenticateAfternic } from "@/lib/afternic/route-helpers";

interface StatsResponse {
  stats?: Array<{ date: string; views: number; leads: number }>;
}

export async function GET(request: NextRequest) {
  const auth = await authenticateAfternic();
  if (!auth.ok) return auth.response;

  const params = request.nextUrl.searchParams;
  const rawDomain = params.get("domain");
  const requestedDays = Number(params.get("days") ?? 30);
  const days = Number.isFinite(requestedDays)
    ? Math.min(366, Math.max(1, Math.round(requestedDays)))
    : 30;

  const start = new Date();
  start.setUTCDate(start.getUTCDate() - (days - 1));
  start.setUTCHours(0, 0, 0, 0);
  const startDate = start.toISOString();

  const path = rawDomain
    ? `/stats/${encodeURIComponent(toAsciiDomain(rawDomain))}?startDate=${encodeURIComponent(startDate)}&days=${days}`
    : `/stats?startDate=${encodeURIComponent(startDate)}&days=${days}`;

  try {
    const data = await callAfternic<StatsResponse>(auth.credentials, "GET", path);
    const stats = data?.stats ?? [];
    const totals = stats.reduce(
      (acc, point) => ({
        views: acc.views + (Number(point.views) || 0),
        leads: acc.leads + (Number(point.leads) || 0),
      }),
      { views: 0, leads: 0 }
    );

    return NextResponse.json({
      data: { days, stats, totals },
    });
  } catch (error) {
    return afternicErrorResponse(error);
  }
}
