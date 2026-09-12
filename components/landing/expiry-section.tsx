import Link from "next/link";
import { ArrowRight, AlertTriangle, CheckCircle2 } from "lucide-react";
import { SectionLabel } from "./shared";

const renewalRows = [
  { icon: AlertTriangle, n: "3 domains", t: "7 days", c: "text-destructive" },
  { icon: AlertTriangle, n: "12 domains", t: "30 days", c: "text-amber-500" },
  { icon: CheckCircle2, n: "1,269 domains", t: "> 30 days", c: "text-primary-deep" },
];

const timeFilters = ["7 days", "30 days", "60 days", "90 days"];

export function ExpirySection({ ctaHref }: { ctaHref: string }) {
  return (
    <section className="bg-tint py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 lg:grid-cols-2">
        <div>
          <SectionLabel>Never miss an expiry</SectionLabel>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Never lose a valuable domain to an expiry date.
          </h2>
          <p className="mt-4 max-w-sm text-muted-foreground">
            DomainVault monitors your domain expiry dates and gives you clear warnings before
            domains need attention.
          </p>
          <Link
            href={ctaHref}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-deep"
          >
            View renewal calendar <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5 shadow">
            <p className="mb-3 text-sm font-bold">Renewals coming up</p>
            {renewalRows.map((r, i) => {
              const Icon = r.icon;
              return (
                <div
                  key={i}
                  className="flex items-center justify-between border-t border-border py-2.5 text-sm"
                >
                  <span className="flex items-center gap-2 font-medium">
                    <Icon className={`h-4 w-4 ${r.c}`} /> {r.n}
                  </span>
                  <span className="text-muted-foreground">{r.t}</span>
                </div>
              );
            })}
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow">
            <p className="mb-3 text-sm font-bold">Filter by time</p>
            <div className="space-y-2">
              {timeFilters.map((t, i) => (
                <div
                  key={t}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                    i === 0
                      ? "border-primary bg-tint text-primary-deep"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
