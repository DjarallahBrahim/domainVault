"use client";

import { useSidebarStore } from "@/lib/hooks/use-sidebar";
import { cn } from "@/lib/utils";

export function DashboardMain({ children }: { children: React.ReactNode }) {
  const pinned = useSidebarStore((s) => s.pinned);

  const sidebarWidth = pinned ? "md:pl-64" : "md:pl-16";

  return (
    <main
      className={cn(
        "pb-16 md:pb-0 p-4 md:p-6 lg:p-8 min-h-screen transition-all duration-200",
        sidebarWidth
      )}
    >
      {children}
    </main>
  );
}
