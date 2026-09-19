import { cn } from "@/lib/utils";

/**
 * Theme-aware brand logo. Uses the dark-wordmark asset on light backgrounds and
 * the white-wordmark asset on dark backgrounds (both PNGs have transparent bg).
 */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <span role="img" aria-label="DNfly.io" className="inline-flex items-center">
      <img
        src="/logos/logo-white-transparent.png"
        alt=""
        className={cn("h-8 w-auto dark:hidden", className)}
      />
      <img
        src="/logos/logo-black-transparent.png"
        alt=""
        className={cn("hidden h-8 w-auto dark:block", className)}
      />
    </span>
  );
}

/** Symbol-only mark (no wordmark) for tight spaces like the collapsed sidebar. */
export function BrandIcon({ className }: { className?: string }) {
  return (
    <img
      src="/logos/logo-icon.png"
      alt="DNfly.io"
      className={cn("h-8 w-8 object-contain", className)}
    />
  );
}
