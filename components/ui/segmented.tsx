"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { springSnappy } from "@/lib/motion";

export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface SegmentedProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  size?: "xs" | "sm";
  className?: string;
  "aria-label"?: string;
}

/**
 * Segmented — Apple-style mutually exclusive control with a single sliding,
 * spring-driven thumb instead of N simultaneously-active fills. Exposes
 * role="group" + aria-pressed and responds to arrow keys (skill §10).
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = "xs",
  className,
  "aria-label": ariaLabel,
}: SegmentedProps<T>) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const optionRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const [thumb, setThumb] = React.useState({ left: 0, width: 0, ready: false });

  const activeIndex = options.findIndex((o) => o.value === value);

  React.useLayoutEffect(() => {
    const el = activeIndex >= 0 ? optionRefs.current[activeIndex] : null;
    const container = containerRef.current;
    if (!el || !container) {
      setThumb((t) => ({ ...t, ready: false }));
      return;
    }
    setThumb({
      left: el.offsetLeft,
      width: el.offsetWidth,
      ready: true,
    });
  }, [activeIndex, value, options]);

  function moveToIndex(index: number) {
    if (index < 0 || index >= options.length || options[index].disabled) return;
    onChange(options[index].value);
    optionRefs.current[index]?.focus();
  }

  function selectNext(delta: 1 | -1) {
    if (activeIndex < 0) {
      const first = options.findIndex((o) => !o.disabled);
      if (first >= 0) moveToIndex(first);
      return;
    }
    let next = activeIndex + delta;
    while (next >= 0 && next < options.length && options[next].disabled) {
      next += delta;
    }
    if (next >= 0 && next < options.length) moveToIndex(next);
  }

  const sizeCls = size === "sm" ? "h-9 px-3.5 text-sm" : "h-7 px-3 text-xs";

  return (
    <div
      ref={containerRef}
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "relative inline-flex items-center rounded-full bg-bg-elevated/80 p-0.5 text-text-muted",
        className
      )}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-y-0.5 rounded-full bg-bg-surface shadow-card ring-1 ring-border/40"
        animate={{
          left: thumb.left,
          width: thumb.width,
          opacity: thumb.ready ? 1 : 0,
        }}
        transition={springSnappy}
        initial={false}
      />
      {options.map((option, index) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            ref={(node) => {
              optionRefs.current[index] = node;
            }}
            type="button"
            disabled={option.disabled}
            aria-pressed={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault();
                selectNext(1);
              } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault();
                selectNext(-1);
              }
            }}
            className={cn(
              "relative z-10 inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.96]",
              sizeCls,
              isActive ? "text-text-primary" : "hover:text-text-primary"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
