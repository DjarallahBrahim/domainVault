import { ShieldCheck } from "lucide-react";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
        <ShieldCheck className="h-4 w-4 text-primary-foreground" />
      </span>
      <span
        className={`font-display text-lg font-bold ${light ? "text-primary-foreground" : "text-foreground"}`}
      >
        DNfly.io
      </span>
    </div>
  );
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
