import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight, BarChart3, TrendingUp, Upload, Tags, Bell, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShowcaseSection } from "@/components/landing/showcase-section";

interface LandingPageProps {
  isAuthenticated: boolean;
  showcaseDomains?: Array<{
    domain: string;
    notes: string | null;
    tags: string[] | null;
    bin: number | null;
  }>;
}

const features = [
  {
    icon: Upload,
    title: "CSV Import & Manual Entry",
    description:
      "Upload thousands of domains via CSV or add them one by one. Smart validation catches errors before import.",
  },
  {
    icon: Tags,
    title: "Domain Management",
    description:
      "Track registrar, purchase price, tags, and expiry dates. Filter and search across your entire portfolio with ease.",
  },
  {
    icon: Bell,
    title: "Expiry Monitoring",
    description:
      "Never miss a renewal. Color-coded expiry badges and critical alerts keep you ahead of every deadline.",
  },
  {
    icon: TrendingUp,
    title: "Promote Your Domains",
    description:
      "Weekly promotion batches pick domains ready to market. One-click promote with inline confirmation.",
  },
  {
    icon: DollarSign,
    title: "Sales & Earnings",
    description:
      "Log sales, calculate ROI, and track platform performance. Every sale stays linked to your domain history.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Rich charts and KPI cards show portfolio value, expiry distribution, registrar breakdown, and revenue trends.",
  },
];

export function LandingPage({ isAuthenticated, showcaseDomains }: LandingPageProps) {
  const ctaHref = isAuthenticated ? "/dashboard" : "/login";
  const ctaText = isAuthenticated ? "Go to Dashboard" : "Get Started Free";
  const secondaryHref = isAuthenticated ? undefined : "/register";
  const secondaryText = isAuthenticated ? undefined : "Create Account";

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary font-sans">
      {/* Nav */}
      <nav className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-primary text-white text-sm font-bold">
              DV
            </div>
            <span className="text-xl">DomainVault</span>
          </Link>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className={cn(buttonVariants({ variant: "default", size: "sm" }))}
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-text-muted transition-colors hover:text-text-primary"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className={cn(buttonVariants({ variant: "default", size: "sm" }))}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-4 py-20 sm:px-6 sm:py-28 lg:py-36">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-bg-surface px-4 py-1.5 text-sm text-text-muted">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-success" />
            </span>
            Now in public beta
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Manage Your Domain Portfolio{" "}
            <span className="text-accent-primary">Like a Pro</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-text-muted">
            Track, analyze, and grow your domain investments — all in one place. Import your
            portfolio in seconds, monitor expiry deadlines, promote domains, and log sales with
            powerful analytics.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={ctaHref}
              className={cn(buttonVariants({ variant: "default", size: "lg" }), "gap-2 px-8 text-base")}
            >
              {ctaText}
              <ArrowRight className="h-4 w-4" />
            </Link>
            {secondaryHref && (
              <Link
                href={secondaryHref}
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "px-8 text-base"
                )}
              >
                {secondaryText}
              </Link>
            )}
          </div>
        </div>
      </section>

      <ShowcaseSection domains={showcaseDomains ?? []} />

      {/* Features */}
      <section className="border-t border-border bg-bg-surface px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Everything You Need to Dominate
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-text-muted">
              From import to sale, DomainVault covers every stage of your domain investment
              workflow.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border bg-bg-primary p-6 transition-shadow hover:shadow-lg"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent-primary/10">
                  <feature.icon className="h-5 w-5 text-accent-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to Take Control of Your Portfolio?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-text-muted">
            Join domain investors who trust DomainVault to manage their portfolios. Start for free
            — no credit card required.
          </p>
          <div className="mt-8">
            <Link
              href={ctaHref}
              className={cn(buttonVariants({ variant: "default", size: "lg" }), "gap-2 px-8 text-base")}
            >
              {ctaText}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-text-muted">
            &copy; {new Date().getFullYear()} DomainVault. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm text-text-muted transition-colors hover:text-text-primary"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm text-text-muted transition-colors hover:text-text-primary"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
