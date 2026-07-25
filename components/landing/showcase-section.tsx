import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ShowcaseCard } from "@/components/landing/showcase-card";

interface ShowcaseDomain {
  domain: string;
  notes: string | null;
  tags: string[] | null;
  bin: number | null;
}

interface ShowcaseSectionProps {
  domains: ShowcaseDomain[];
}

export function ShowcaseSection({ domains }: ShowcaseSectionProps) {
  if (domains.length === 0) return null;

  return (
    <section className="border-t border-border bg-bg-surface px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Featured Domains
            </h2>
            <p className="mt-2 text-text-muted">
              Hand-picked domains available for acquisition
            </p>
          </div>
          <Link
            href="/showcase"
            className="flex items-center gap-1 text-sm font-medium text-accent-primary hover:underline"
          >
            See All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {domains.map((d) => (
            <ShowcaseCard
              key={d.domain}
              domain={d.domain}
              notes={d.notes}
              tags={d.tags}
              bin={d.bin}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
