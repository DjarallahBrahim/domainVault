import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { SectionLabel } from "./shared";
import { Screenshot } from "./screenshot";
import { marketplaceLogos } from "./data";

export function HeroSection({ ctaHref }: { ctaHref: string }) {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-14 pb-20">
      <div className="grid items-start gap-8 lg:grid-cols-[0.75fr_1.25fr]">
        <div>
          <SectionLabel>The operating system for domain investors</SectionLabel>
          <h1 className="text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl lg:text-[2.5rem]">
            Your domains.
            <br />
            Managed, marketed &amp; <span className="text-primary-deep">sold automatically.</span>
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-7 text-muted-foreground">
            Import your portfolio, monitor renewals, track sales, and publish domains to Sedo,
            Spaceship, Atom and more — from one dashboard.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-colors hover:bg-primary-deep"
            >
              Start managing your domains <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-accent"
            >
              <Play className="h-4 w-4 text-primary-deep" /> See how it works
            </a>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {marketplaceLogos.map((logo) => (
              <img
                key={logo.alt}
                src={logo.src}
                alt={logo.alt}
                className="h-5 w-auto max-w-[72px] object-contain"
              />
            ))}
            <span className="text-xs font-medium text-muted-foreground">more soon..</span>
          </div>
        </div>
        <div>
          <p className="mb-2 text-right text-[10px] font-medium text-muted-foreground">
            Public Beta <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-primary" />
          </p>
          <Screenshot
            src="/images/dashboard-hero.png"
            alt="DomainVault portfolio dashboard overview"
            className="w-full rounded-2xl shadow-2xl shadow-primary/10"
          />
        </div>
      </div>
    </section>
  );
}
