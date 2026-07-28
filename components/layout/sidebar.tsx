"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Globe,
  Upload,
  DollarSign,
  Settings,
  Pin,
  PinOff,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { SidebarFooter } from "./sidebar-footer";
import { useSidebarStore } from "@/lib/hooks/use-sidebar";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/domains", label: "Domains", icon: Globe },
  { href: "/dns-checker", label: "DNS Checker", icon: Search },
  { href: "/import", label: "Import", icon: Upload },
  { href: "/sales", label: "Sales", icon: DollarSign },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { pinned, hovered, setPinned, setHovered } = useSidebarStore();

  const isExpanded = pinned || hovered;

  return (
    <aside
      onMouseEnter={() => !pinned && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "hidden md:flex md:flex-col md:sticky md:top-0 md:h-screen shrink-0 z-30 border-r border-border bg-bg-surface transition-all duration-200 ease-in-out",
        isExpanded ? "md:w-64" : "md:w-16"
      )}
    >
      <div className="flex h-14 items-center justify-between px-3 border-b border-border">
        {isExpanded ? (
          <Link
            href="/dashboard"
            className="font-bold text-lg font-display text-accent-primary truncate"
          >
            DomainVault
          </Link>
        ) : (
          <Link
            href="/dashboard"
            className="font-bold text-lg font-display text-accent-primary mx-auto"
          >
            DV
          </Link>
        )}
        <div className="flex items-center gap-1">
          {isExpanded && <ThemeToggle />}
          <button
            onClick={() => setPinned(!pinned)}
            className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
            aria-label={pinned ? "Unpin sidebar" : "Pin sidebar"}
          >
            {pinned ? (
              <Pin className="h-4 w-4" />
            ) : (
              <PinOff className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={!isExpanded ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                !isExpanded && "justify-center px-2",
                isActive
                  ? "bg-accent-primary/10 text-accent-primary"
                  : "text-text-muted hover:bg-bg-elevated hover:text-text-primary"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {isExpanded && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {isExpanded && <SidebarFooter />}
      {!isExpanded && (
        <div className="border-t border-border p-3 flex justify-center">
          <ThemeToggle />
        </div>
      )}
    </aside>
  );
}
