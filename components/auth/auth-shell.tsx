import Link from "next/link";
import { Check, Lock, ShieldCheck } from "lucide-react";

const highlights = [
  "Import thousands of domains in seconds",
  "Never miss a renewal date",
  "Publish & sync to every marketplace",
];

/** Decorative marketplace "stickers" (uses the existing /logos assets). */
const stickers = [
  { src: "/logos/sedo.png", alt: "Sedo", rotate: "rotate-6", delay: "0s" },
  { src: "/logos/atom.png", alt: "Atom", rotate: "-rotate-3", delay: "1.4s" },
  { src: "/logos/spaceship.png", alt: "Spaceship", rotate: "rotate-3", delay: "2.8s" },
];

function BrandMark() {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm">
        <ShieldCheck className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
      </span>
      <span className="text-lg font-bold tracking-tight text-text-primary">DNfly.io</span>
    </span>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-bg-primary lg:flex-row">
      {/* Product screenshot as a full-page ambient background */}
      <img
        src="/images/dashboard-hero.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover object-top opacity-90 blur-[4px]"
      />
      {/* Scrim — keeps overlaid copy readable over the busy screenshot (WCAG contrast) */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-tint/90 via-tint/80 to-tint/95" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

      {/* Brand / value panel — desktop only */}
      <aside className="relative z-10 hidden lg:flex lg:w-[45%] lg:flex-col lg:p-12 xl:w-1/2 xl:p-16">
        <Link
          href="/"
          className="w-fit rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <BrandMark />
        </Link>

        <div className="flex flex-1 flex-col justify-center gap-8 py-8">
          <div className="max-w-lg">
            <h2 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-text-primary xl:text-5xl">
              Your domains, managed, marketed &amp; sold automatically.
            </h2>
            <p className="mt-6 text-lg leading-8 text-text-muted">
              The all-in-one workspace for domain investors — track expiry dates, measure
              portfolio value, and publish to every marketplace.
            </p>
          </div>

          <ul className="max-w-lg space-y-5 text-lg font-medium text-text-primary">
            {highlights.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
                </span>
                {item}
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-4 pt-2">
            {stickers.map((sticker) => (
              <div
                key={sticker.alt}
                aria-hidden="true"
                className="auth-sticker"
                style={{ animationDelay: sticker.delay }}
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl border border-border/60 bg-bg-surface/85 p-3 shadow-float backdrop-blur ${sticker.rotate}`}
                >
                  <img src={sticker.src} alt="" className="max-h-7 max-w-full object-contain" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Form panel — shares the same background image as the brand panel */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-10">
        <Link
          href="/"
          className="mb-8 w-fit rounded-lg lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <BrandMark />
        </Link>

        <div className="w-full max-w-md">{children}</div>

        <p className="mt-10 flex items-center gap-1.5 text-xs text-text-muted">
          <Lock className="h-3 w-3" aria-hidden="true" />
          Secure, encrypted sign-in
        </p>
      </main>
    </div>
  );
}
