"use client";

import { create } from "zustand";

interface SidebarState {
  pinned: boolean;
  hovered: boolean;
  setPinned: (pinned: boolean) => void;
  setHovered: (hovered: boolean) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  pinned: true,
  hovered: false,
  setPinned: (pinned) => set({ pinned }),
  setHovered: (hovered) => set({ hovered }),
}));
