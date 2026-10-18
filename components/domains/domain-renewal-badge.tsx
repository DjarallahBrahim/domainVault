import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface DomainRenewalBadgeProps {
  count?: number | null;
  totalCost?: number | null;
  className?: string;
}

/**
 * Tiny superscript badge shown next to a domain name in the lists.
 * Renders nothing for domains that were never renewed.
 */
export function DomainRenewalBadge({ count, totalCost, className }: DomainRenewalBadgeProps) {
  if (!count || count < 1) return null;

  const times = count === 1 ? "time" : "times";
  const spent = totalCost && totalCost > 0 ? ` · $${totalCost.toFixed(2)} spent` : "";

  return (
    <span
      title={`Renewed ${count} ${times}${spent}`}
      aria-label={`Renewed ${count} ${times}`}
      className={cn(
        "ml-0.5 inline-flex -translate-y-1.5 items-center gap-0.5 rounded-full bg-amber-400/15 px-1 text-[9px] font-bold leading-4 text-amber-500 ring-1 ring-amber-400/30",
        className
      )}
    >
      <Star className="h-2.5 w-2.5 fill-current" aria-hidden="true" />
      {count > 99 ? "99+" : count}
    </span>
  );
}
