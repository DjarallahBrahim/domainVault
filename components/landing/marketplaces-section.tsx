import { CheckGlyph } from "./shared";
import { marketplaceLogos } from "./data";

function MarketplaceSyncDiagram() {
  return (
    <div
      className="relative min-h-[430px] w-full"
      aria-label="DomainVault publishing workflow"
    >
      {/* DomainVault card */}
      <div className="absolute left-1/2 top-0 z-20 w-[260px] -translate-x-1/2">
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#DCFCE7]">
              <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                  stroke="#16A34A"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 12l2 2 4-4"
                  stroke="#16A34A"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div>
              <p className="text-[15px] font-bold text-[#172033]">DomainVault</p>
              <p className="mt-0.5 text-xs text-[#94A3B8]">1,284 domains managed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Connector lines */}
      <svg
        className="pointer-events-none absolute inset-0 z-10 h-full w-full"
        viewBox="0 0 700 430"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M350 84 C350 105 350 112 350 135" stroke="#86EFAC" strokeWidth="2" strokeDasharray="4 5" />
        <path d="M350 170 C300 200 90 195 88 268" stroke="#86EFAC" strokeWidth="2" strokeDasharray="4 5" />
        <path d="M350 170 C330 205 262 205 262 268" stroke="#86EFAC" strokeWidth="2" strokeDasharray="4 5" />
        <path d="M350 170 C370 205 438 205 438 268" stroke="#86EFAC" strokeWidth="2" strokeDasharray="4 5" />
        <path d="M350 170 C400 200 610 195 612 268" stroke="#86EFAC" strokeWidth="2" strokeDasharray="4 5" />
        <path d="M83 261 L88 270 L93 261" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M257 261 L262 270 L267 261" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M433 261 L438 270 L443 261" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M607 261 L612 270 L617 261" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Arcs from bottom caption curving up to the outer platforms */}
        <path d="M300 428 C180 420 60 395 88 300" stroke="#86EFAC" strokeWidth="2" strokeDasharray="4 5" />
        <path d="M400 428 C520 420 640 395 612 300" stroke="#86EFAC" strokeWidth="2" strokeDasharray="4 5" />
        <path d="M83 304 L88 295 L93 304" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M607 304 L612 295 L617 304" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {/* Pill */}
      <div className="absolute left-1/2 top-[125px] z-30 -translate-x-1/2">
        <div className="flex items-center gap-2 whitespace-nowrap rounded-full border border-[#86EFAC] bg-white px-5 py-2.5 text-xs font-semibold text-[#16A34A] shadow-sm">
          <span className="h-2 w-2 shrink-0 rounded-full bg-[#22C55E]" />
          Select domains to publish
        </div>
      </div>

      {/* Marketplace cards */}
      <div className="absolute inset-x-0 bottom-12 z-20 grid grid-cols-4 gap-2 sm:gap-4">
        {marketplaceLogos.map((logo) => (
          <div
            key={logo.alt}
            className="rounded-2xl border border-[#E2E8F0] bg-white px-3 py-5 text-center shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_35px_rgba(15,23,42,0.1)]"
          >
            <div className="flex h-7 items-center justify-center">
              <img src={logo.src} alt={logo.alt} className="max-h-7 max-w-full object-contain" />
            </div>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] font-medium text-[#16A34A]">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#DCFCE7]">
                <CheckGlyph className="h-[9px] w-[9px]" />
              </span>
              Published automatically
            </p>
          </div>
        ))}
      </div>

      {/* Bottom caption */}
      <div className="absolute bottom-0 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap text-[11px] font-medium text-[#16A34A]">
        <span>Update your price once. Sync everywhere.</span>
      </div>
    </div>
  );
}

export function MarketplacesSection() {
  return (
    <section id="marketplaces" className="relative overflow-hidden bg-white py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[28px] border border-[#DCFCE7] bg-[#F3FCF7] px-6 py-12 lg:p-16">
          <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[#DCFCE7]/50 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-[#ECFDF5] blur-3xl" />

          <div className="relative grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="max-w-xl">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[#16A34A]">
                Automate your marketplaces
              </p>
              <h2 className="text-4xl font-bold leading-[1.15] tracking-[-0.04em] text-[#10213F] sm:text-5xl">
                One portfolio.
                <br />
                Every marketplace.
              </h2>
              <p className="mt-6 max-w-md text-lg leading-8 text-[#64748B]">
                Connect your marketplaces and publish your domains automatically. Update your price
                once. Sync everywhere.
              </p>
              <ul className="mt-8 space-y-4 text-sm font-medium text-[#475569]">
                {marketplaceLogos.map((logo) => (
                  <li key={logo.alt} className="flex items-center gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#DCFCE7]">
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

            <MarketplaceSyncDiagram />
          </div>
        </div>
      </div>
    </section>
  );
}
