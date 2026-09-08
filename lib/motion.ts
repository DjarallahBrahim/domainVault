import type { Variants } from "motion/react";

/**
 * House motion presets (ADR-010).
 *
 * Apple design language prefers critically-damped springs (no overshoot) for
 * default UI motion; bounce is reserved for momentum-driven gestures. Motion
 * lets a spring re-target from the current value + velocity, which is exactly
 * what interruptible UI needs (skill §3–§5).
 */

export const DURATION = {
  quick: 0.3,
  default: 0.4,
  calm: 0.5,
} as const;

/** Critically-damped spring used as the default for any UI move/resize. */
export const spring = {
  type: "spring",
  bounce: 0,
  duration: DURATION.default,
} as const;

/** Snappier variant for the segmented-control thumb and small chips. */
export const springSnappy = {
  type: "spring",
  bounce: 0,
  duration: DURATION.quick,
} as const;

/** Slower variant for large surfaces (sheets, hero, panels). */
export const springCalm = {
  type: "spring",
  bounce: 0,
  duration: DURATION.calm,
} as const;

/**
 * Entrance preset — fade + small rise. Call with a per-item delay for
 * stagger. MotionConfig `reducedMotion="user"` disables the transform under
 * reduced motion, leaving a plain opacity cross-fade (skill §14).
 */
export function fadeUp(delay = 0): Variants {
  return {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", bounce: 0, duration: DURATION.calm, delay },
    },
  };
}

/** Instant-but-gentle press feedback fires on pointer-down, not release. */
export const pressScale = { scale: 0.97 } as const;
