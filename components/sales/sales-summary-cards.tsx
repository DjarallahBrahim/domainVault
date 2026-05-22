import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, BarChart3, ArrowUpRight } from "lucide-react";

interface SalesSummaryCardsProps {
  count: number;
  revenue: number;
  average: number;
  highest: number;
}

export function SalesSummaryCards({
  count,
  revenue,
  average,
  highest,
}: SalesSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-accent-primary/10">
              <BarChart3 className="h-5 w-5 text-accent-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{count.toLocaleString()}</p>
              <p className="text-xs text-text-muted">Total Sales</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-accent-success/10">
              <DollarSign className="h-5 w-5 text-accent-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                ${revenue.toLocaleString()}
              </p>
              <p className="text-xs text-text-muted">Total Revenue</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-accent-warning/10">
              <TrendingUp className="h-5 w-5 text-accent-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                ${average.toLocaleString()}
              </p>
              <p className="text-xs text-text-muted">Average Sale</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-accent-primary/10">
              <ArrowUpRight className="h-5 w-5 text-accent-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                ${highest.toLocaleString()}
              </p>
              <p className="text-xs text-text-muted">Highest Sale</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
