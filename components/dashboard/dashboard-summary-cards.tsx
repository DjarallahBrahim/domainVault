import { Card, CardContent } from "@/components/ui/card";
import { Globe, CheckCircle2, AlertTriangle, DollarSign } from "lucide-react";

interface DashboardSummaryCardsProps {
  total: number;
  active: number;
  expiringSoon: number;
  portfolioValue: number;
}

export function DashboardSummaryCards({
  total,
  active,
  expiringSoon,
  portfolioValue,
}: DashboardSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-accent-primary/10">
              <Globe className="h-5 w-5 text-accent-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{total.toLocaleString()}</p>
              <p className="text-xs text-text-muted">Total Domains</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-accent-success/10">
              <CheckCircle2 className="h-5 w-5 text-accent-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{active.toLocaleString()}</p>
              <p className="text-xs text-text-muted">Active</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-accent-warning/10">
              <AlertTriangle className="h-5 w-5 text-accent-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{expiringSoon.toLocaleString()}</p>
              <p className="text-xs text-text-muted">Expiring Soon</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-accent-primary/10">
              <DollarSign className="h-5 w-5 text-accent-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                ${portfolioValue.toLocaleString()}
              </p>
              <p className="text-xs text-text-muted">Portfolio Value</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
