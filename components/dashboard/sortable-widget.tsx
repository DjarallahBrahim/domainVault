"use client";

import type { ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { DragHandleContext } from "@/components/dashboard/drag-handle-context";

interface SortableWidgetProps {
  id: string;
  span: string;
  children: ReactNode;
}

/**
 * The single reusable drag wrapper. All drag-and-drop wiring lives here; the
 * widget inside only renders its normal `WidgetCard`.
 */
export function SortableWidget({ id, span, children }: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        filter: isDragging ? "drop-shadow(0 16px 32px rgba(0, 0, 0, 0.18))" : undefined,
      }}
      className={cn("min-w-0", span, isDragging && "z-10")}
    >
      <DragHandleContext.Provider value={{ attributes, listeners, setActivatorNodeRef }}>
        {children}
      </DragHandleContext.Provider>
    </div>
  );
}
