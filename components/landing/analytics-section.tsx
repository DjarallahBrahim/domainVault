import { CheckCircle2 } from "lucide-react";
import { SectionLabel } from "./shared";
import { Screenshot } from "./screenshot";

const analyticsPoints = [
  "Portfolio value & growth",
  "Sales and revenue tracking",
  "Marketplace performance",
  "Renewal costs",
  "Top-performing domains",
];

export function AnalyticsSection() {
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 lg:grid-cols-[1.35fr_0.65fr]">
      <div className="order-2 lg:order-1">
        <Screenshot
          src="/images/portfolio-performance.png"
          alt="DomainVault portfolio analytics dashboard showing expiry overview, critical renewals, top sales and platform performance"
          className="w-full rounded-2xl border border-border shadow-2xl shadow-primary/10"
        />
      </div>
      <div className="order-1 lg:order-2">
        <SectionLabel>Real insights. Better decisions.</SectionLabel>
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Know exactly how your portfolio is performing.
        </h2>
        <p className="mt-4 max-w-sm text-muted-foreground">
          Track your portfolio value, revenue, ROI and marketplace performance with beautiful
          visualizations and detailed reports.
        </p>
        <ul className="mt-6 space-y-2 text-sm font-medium">
          {analyticsPoints.map((i) => (
            <li key={i} className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary-deep" /> {i}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
