import { Badge } from "@/components/ui/badge";

function daysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  return Math.ceil(
    (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function getExpiryStyle(days: number): string {
  if (days <= 0) return "bg-accent-danger/10 text-accent-danger border-accent-danger/20";
  if (days <= 30) return "bg-accent-danger/10 text-accent-danger border-accent-danger/20";
  if (days <= 90) return "bg-accent-warning/10 text-accent-warning border-accent-warning/20";
  if (days <= 180) return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
  return "bg-accent-success/10 text-accent-success border-accent-success/20";
}

function getExpiryLabel(days: number): string {
  if (days <= 0) return "Expired";
  if (days <= 30) return `${days}d left`;
  if (days <= 90) return `${days}d left`;
  if (days <= 180) return `${days}d left`;
  return `${days}d left`;
}

export function DomainExpiryBadge({
  expirationDate,
}: {
  expirationDate: string;
}) {
  const days = daysUntil(expirationDate);

  return (
    <Badge variant="outline" className={getExpiryStyle(days)}>
      {getExpiryLabel(days)}
    </Badge>
  );
}
