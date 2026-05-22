import { Badge } from "@/components/ui/badge";

const statusStyles: Record<string, string> = {
  active: "bg-accent-success/10 text-accent-success border-accent-success/20",
  expired: "bg-accent-danger/10 text-accent-danger border-accent-danger/20",
  sold: "bg-accent-primary/10 text-accent-primary border-accent-primary/20",
  pending: "bg-accent-warning/10 text-accent-warning border-accent-warning/20",
};

const statusLabels: Record<string, string> = {
  active: "Active",
  expired: "Expired",
  sold: "Sold",
  pending: "Pending",
};

export function DomainStatusBadge({ status }: { status: string }) {
  const style = statusStyles[status] ?? statusStyles.active;
  const label = statusLabels[status] ?? status;

  return (
    <Badge variant="outline" className={style}>
      {label}
    </Badge>
  );
}
