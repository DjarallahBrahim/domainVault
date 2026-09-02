"use client";

import * as React from "react";
import { Globe, PhoneCall, ThumbsUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { OutreachRow, ReservedTld } from "@/types/promoting";

function useCountUp(target: number) {
  const [value, setValue] = React.useState(0);

  React.useEffect(() => {
    let frame: number;
    const duration = 500;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setValue(Math.round(target * progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return value;
}

interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  accentClass: string;
  subtext?: string;
  subtextClass?: string;
}

function SummaryCard({ icon, label, value, accentClass, subtext, subtextClass }: SummaryCardProps) {
  const animated = useCountUp(value);

  return (
    <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md overflow-hidden">
      <div className={cn("h-1 w-full", accentClass)} />
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-muted">{label}</p>
          <span className="text-text-muted">{icon}</span>
        </div>
        <p className="mt-2 font-display text-3xl font-bold text-text-primary">{animated}</p>
        {subtext && <p className={cn("mt-1 text-xs", subtextClass)}>{subtext}</p>}
      </CardContent>
    </Card>
  );
}

interface PromotingSummaryCardsProps {
  tlds: ReservedTld[];
  outreach: Map<string, OutreachRow>;
  isLoading: boolean;
}

export function PromotingSummaryCards({ tlds, outreach, isLoading }: PromotingSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-2 h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const contacted = Array.from(outreach.values()).filter((row) => row.contacted).length;
  const positive = Array.from(outreach.values()).filter(
    (row) => row.reply_status === "positive"
  ).length;
  const negative = Array.from(outreach.values()).filter(
    (row) => row.reply_status === "negative"
  ).length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <SummaryCard
        icon={<Globe className="h-4 w-4" />}
        label="Reserved TLDs"
        value={tlds.length}
        accentClass="bg-accent-primary"
      />
      <SummaryCard
        icon={<PhoneCall className="h-4 w-4" />}
        label="Contacted"
        value={contacted}
        accentClass="bg-accent-warning"
      />
      <SummaryCard
        icon={<ThumbsUp className="h-4 w-4" />}
        label="Positive Replies"
        value={positive}
        accentClass="bg-accent-success"
        subtext={`${negative} negative`}
        subtextClass="text-accent-danger"
      />
    </div>
  );
}
