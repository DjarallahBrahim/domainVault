import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { Screenshot } from "./screenshot";
import { marketplaceLogos } from "./data";

export function HeroSection({ ctaHref }: { ctaHref: string }) {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-16 pb-20 sm:pt-20">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-primary-deep shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          The operating system for domain investors
        </div>

        <h1 className="text-balance text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-5xl lg:text-[3.5rem]">
          Your domains.
          <br />
          Managed, marketed &amp; <span className="text-primary-deep">sold automatically.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-8 text-muted-foreground sm:text-lg">
          Import your portfolio, monitor renewals, track sales, and publish domains to Sedo,
          Spaceship, Atom and more — from one dashboard.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={ctaHref}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-colors hover:bg-primary-deep sm:w-auto"
          >
            Start managing your domains <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#how"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold transition-colors hover:bg-accent sm:w-auto"
          >
            <Play className="h-4 w-4 text-primary-deep" /> See how it works
          </a>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          {marketplaceLogos.map((logo) => (
            <img
              key={logo.alt}
              src={logo.src}
              alt={logo.alt}
              className="h-5 w-auto max-w-[72px] object-contain opacity-80 transition-opacity hover:opacity-100"
            />
          ))}
          <span className="text-xs font-medium text-muted-foreground">more soon..</span>
        </div>
      </div>

      <div className="relative mx-auto mt-16 max-w-6xl">
        <p className="mb-3 text-right text-[10px] font-medium text-muted-foreground">
          Public Beta <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-primary" />
        </p>
        <div className="rounded-2xl bg-gradient-to-b from-primary/10 to-transparent p-px">
          <Screenshot
            src="/images/dashboard-hero.png"
            alt="DNfly.io portfolio dashboard overview"
            className="h-auto w-full rounded-2xl shadow-2xl shadow-primary/10"
          />
        </div>
      </div>
    </section>
  );
}
