"use client";

import { useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  /** Small explanatory text shown on hover/focus. */
  content: string;
  children: ReactNode;
  /** Preferred placement; flips below when there is no room above. */
  side?: "top" | "bottom";
  className?: string;
}

interface Position {
  left: number;
  top: number;
  placement: "top" | "bottom";
}

/**
 * Lightweight hover/focus tooltip rendered in a portal so it is never clipped
 * by the table's scroll container. No external dependency required.
 */
export function Tooltip({ content, children, side = "top", className }: TooltipProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [position, setPosition] = useState<Position | null>(null);

  if (!content) return <>{children}</>;

  function show() {
    const element = ref.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const placement: Position["placement"] = side === "top" && rect.top < 48 ? "bottom" : side;

    setPosition({
      left: rect.left + rect.width / 2,
      top: placement === "top" ? rect.top - 6 : rect.bottom + 6,
      placement,
    });
  }

  function hide() {
    setPosition(null);
  }

  return (
    <>
      <span
        ref={ref}
        className={className ?? "inline-flex items-center"}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocusCapture={show}
        onBlurCapture={hide}
      >
        {children}
      </span>
      {position && typeof document !== "undefined"
        ? createPortal(
            <span
              role="tooltip"
              className="pointer-events-none fixed z-[100] max-w-[220px] whitespace-normal rounded-md bg-foreground px-2 py-1 text-[11px] font-medium leading-snug text-background shadow-lg animate-in fade-in zoom-in-95 duration-100"
              style={{
                left: position.left,
                top: position.top,
                transform:
                  position.placement === "top" ? "translate(-50%, -100%)" : "translate(-50%, 0)",
              }}
            >
              {content}
            </span>,
            document.body
          )
        : null}
    </>
  );
}
