import { CheckGlyph, SectionLabel } from "./shared";
import { marketplaceLogos, type MarketplaceLogo } from "./data";

function MarketplaceSyncDiagram({ logos }: { logos: MarketplaceLogo[] }) {
  return (
    <div
      className="force-light relative min-h-[384px] w-full"
      aria-label="DomainVault publishing workflow"
    >
      {/* DomainVault card */}
      <div className="absolute left-1/2 top-0 z-20 w-[260px] -translate-x-1/2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-tint text-primary">
              <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 12l2 2 4-4"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div>
              <p className="text-[15px] font-bold text-card-foreground">DomainVault</p>
              <p className="mt-0.5 text-xs text-muted-foreground">1,284 domains managed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Connector lines */}
      <svg
        className="pointer-events-none absolute inset-0 z-10 h-full w-full text-primary"
        viewBox="0 0 700 384"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path className="diagram-flow" d="M350 84 C350 105 350 112 350 135" stroke="currentColor" strokeOpacity="0.4" strokeWidth="2" />
        <path className="diagram-flow" d="M350 170 C300 200 140 195 120 252" stroke="currentColor" strokeOpacity="0.4" strokeWidth="2" />
        <path className="diagram-flow" d="M350 170 C350 205 350 205 350 252" stroke="currentColor" strokeOpacity="0.4" strokeWidth="2" />
        <path className="diagram-flow" d="M350 170 C400 200 560 195 580 252" stroke="currentColor" strokeOpacity="0.4" strokeWidth="2" />
        <path d="M115 243 L120 252 L125 243" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M345 243 L350 252 L355 243" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M575 243 L580 252 L585 243" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Plain circles — movement comes from CSS offset-path + the
            diagram-dot-travel keyframes, sharing the card glow's clock. */}
        <circle r="4" fill="currentColor" className="diagram-dot diagram-dot--left" />
        <circle r="4" fill="currentColor" className="diagram-dot diagram-dot--center" />
        <circle r="4" fill="currentColor" className="diagram-dot diagram-dot--right" />
      </svg>

      {/* Pill */}
      <div className="absolute left-1/2 top-[125px] z-30 -translate-x-1/2">
        <div className="flex items-center gap-2 whitespace-nowrap rounded-full border border-primary/40 bg-card px-5 py-2.5 text-xs font-semibold text-primary shadow-sm">
          <span className="relative flex h-2 w-2 shrink-0 items-center justify-center">
            <span className="diagram-pill-ring absolute left-1/2 top-1/2 h-2 w-2 rounded-full bg-primary" />
            <span className="diagram-pill-dot relative z-[2] h-2 w-2 rounded-full bg-primary" />
          </span>
          Update price ONCE, Sync everywhere
        </div>
      </div>

      {/* Marketplace cards */}
      <div className="absolute inset-x-0 bottom-0 z-20 grid grid-cols-3 gap-2 sm:gap-4">
        {logos.map((logo) => (
          <div
            key={logo.alt}
            className="diagram-card-pulse rounded-2xl border border-border bg-card px-4 py-7 text-center shadow-card transition-transform hover:-translate-y-1"
          >
            <div className="flex h-10 items-center justify-center">
              <img src={logo.src} alt={logo.alt} className="max-h-10 max-w-full rounded-md object-contain" />
            </div>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs font-medium text-primary">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-tint">
                <CheckGlyph className="h-[9px] w-[9px]" />
              </span>
              Published
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MarketplacesSection() {
  const listLogos = marketplaceLogos.filter((logo) => logo.alt !== "Afternic");

  return (
    <section id="marketplaces" className="relative overflow-hidden bg-tint py-20">
      <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="max-w-xl">
            <SectionLabel>Automate your marketplaces</SectionLabel>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              One portfolio.
              <br />
              Every marketplace.
            </h2>
            <p className="mt-6 max-w-md text-lg leading-8 text-muted-foreground">
              Connect your marketplaces and publish your domains automatically. Update your price
              once. Sync everywhere.
            </p>
            <ul className="mt-8 space-y-4 text-sm font-medium text-muted-foreground">
              {listLogos.map((logo) => (
                <li key={logo.alt} className="flex items-center gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-tint text-primary">
                    <CheckGlyph className="h-3 w-3" />
                  </span>
                  {logo.alt}
                </li>
              ))}
              <li className="flex items-center gap-3">
                <span className="h-5 w-5 shrink-0" />
                More coming soon
              </li>
            </ul>
          </div>

          <MarketplaceSyncDiagram logos={listLogos} />
        </div>
      </div>
    </section>
  );
}
