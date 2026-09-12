"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface ScreenshotProps {
  src: string;
  alt: string;
  className?: string;
}

/**
 * Renders an app screenshot, falling back to a labelled placeholder while the
 * real image asset is not yet present in /public/images.
 */
export function Screenshot({ src, alt, className }: ScreenshotProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={cn(
          "flex aspect-[16/10] w-full items-center justify-center rounded-2xl border border-border bg-gradient-to-br from-tint to-card p-6 text-center text-sm font-medium text-muted-foreground",
          className
        )}
      >
        {alt}
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}
