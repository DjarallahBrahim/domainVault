"use client";

import { create } from "zustand";
import { DEFAULT_ORDER, mergeOrder, type WidgetId } from "@/lib/dashboard/widgets";

const STORAGE_KEY = "dv.dashboard.layout.v1";

interface DashboardLayoutState {
  order: WidgetId[];
  hydrated: boolean;
  setOrder: (order: WidgetId[]) => void;
  resetLayout: () => void;
  hydrate: () => void;
}

export const useDashboardLayout = create<DashboardLayoutState>((set, get) => ({
  order: DEFAULT_ORDER,
  hydrated: false,
  setOrder: (order) => {
    set({ order });
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
    } catch {
      // Storage unavailable (private mode / quota) — order stays in memory.
    }
  },
  resetLayout: () => {
    set({ order: DEFAULT_ORDER });
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage failures.
    }
  },
  hydrate: () => {
    if (get().hydrated || typeof window === "undefined") return;
    let order = DEFAULT_ORDER;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) order = mergeOrder(JSON.parse(raw));
    } catch {
      // Corrupt value — fall back to the default order.
    }
    set({ order, hydrated: true });
  },
}));
