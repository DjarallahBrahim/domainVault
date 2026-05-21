"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Globe, Upload, DollarSign, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { SidebarFooter } from "./sidebar-footer";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/domains", label: "Domains", icon: Globe },
  { href: "/import", label: "Import", icon: Upload },
  { href: "/sales", label: "Sales", icon: DollarSign },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:w-64 border-r border-border bg-bg-surface">
      <div className="flex h-14 items-center justify-between px-4 border-b border-border">
        <Link href="/dashboard" className="font-bold text-lg font-display text-accent-primary">
          DomainVault
        </Link>
        <ThemeToggle />
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent-primary/10 text-accent-primary"
                  : "text-text-muted hover:bg-bg-elevated hover:text-text-primary"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <SidebarFooter />
    </aside>
  );
}
