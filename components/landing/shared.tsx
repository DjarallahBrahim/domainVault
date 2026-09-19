import { BrandLogo } from "@/components/ui/brand-logo";

export function Logo({ className }: { className?: string }) {
  return <BrandLogo className={className ?? "h-8"} />;
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary-deep">
      {children}
    </p>
  );
}

export function CheckGlyph({
  className,
  strokeWidth = 3,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M20 6L9 17L4 12"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
