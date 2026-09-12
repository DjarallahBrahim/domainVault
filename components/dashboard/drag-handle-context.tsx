"use client";

import { createContext, useContext } from "react";
import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";

export interface DragHandleApi {
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
  setActivatorNodeRef: (element: HTMLElement | null) => void;
}

/**
 * Supplied by `SortableWidget` so the shared `WidgetCard` header can render a
 * drag grip without every widget knowing about drag-and-drop.
 */
export const DragHandleContext = createContext<DragHandleApi | null>(null);

export function useDragHandle() {
  return useContext(DragHandleContext);
}
