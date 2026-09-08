"use client";

import { MotionConfig } from "motion/react";

/**
 * Global motion configuration. `reducedMotion="user"` makes every motion
 * component respect the OS reduce-motion preference: positional/layout
 * animations are skipped, leaving opacity cross-fades (skill §14).
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
