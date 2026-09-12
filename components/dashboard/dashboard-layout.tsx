"use client";

import { useEffect } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { SortableWidget } from "@/components/dashboard/sortable-widget";
import { WIDGETS, type DashboardWidgetData, type WidgetId } from "@/lib/dashboard/widgets";
import { useDashboardLayout } from "@/lib/hooks/use-dashboard-layout";

interface DashboardLayoutProps {
  data: DashboardWidgetData;
}

export function DashboardLayout({ data }: DashboardLayoutProps) {
  const { order, setOrder, hydrate } = useDashboardLayout();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = order.indexOf(active.id as WidgetId);
    const newIndex = order.indexOf(over.id as WidgetId);
    if (oldIndex < 0 || newIndex < 0) return;
    setOrder(arrayMove(order, oldIndex, newIndex));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={order} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-6 lg:grid-flow-row-dense">
          {order.map((id) => {
            const widget = WIDGETS[id];
            return (
              <SortableWidget key={id} id={id} span={widget.span}>
                {widget.render(data)}
              </SortableWidget>
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
