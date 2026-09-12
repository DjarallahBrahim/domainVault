import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CtaSection({ ctaHref }: { ctaHref: string }) {
  return (
    <section id="cta" className="bg-primary-deep py-20 text-primary-foreground">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-8 px-4">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest opacity-80">
            Ready to get started?
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Your domain portfolio.
            <br />
            On autopilot.
          </h2>
        </div>
        <div>
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-2 rounded-lg bg-card px-6 py-3 text-sm font-semibold text-foreground shadow-lg transition-transform hover:scale-[1.02]"
          >
            Get started for free <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-2 text-center text-xs opacity-80">No credit card required.</p>
        </div>
      </div>
    </section>
  );
}
