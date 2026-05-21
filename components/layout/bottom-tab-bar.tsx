"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Globe, Upload, DollarSign, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/domains", label: "Domains", icon: Globe },
  { href: "/import", label: "Import", icon: Upload },
  { href: "/sales", label: "Sales", icon: DollarSign },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-border bg-bg-surface">
      <div className="flex h-full items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-2 py-1 text-xs transition-colors",
                isActive ? "text-accent-primary" : "text-text-muted"
              )}
            >
              <item.icon className="h-5 w-5" />
              {isActive && <span className="text-[10px]">{item.label}</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
