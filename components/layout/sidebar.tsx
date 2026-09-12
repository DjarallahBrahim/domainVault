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
  Network,
  Megaphone,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { SidebarFooter } from "./sidebar-footer";
import { useSidebarStore } from "@/lib/hooks/use-sidebar";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/domains", label: "Domains", icon: Globe },
  { href: "/dns-checker", label: "DNS Checker", icon: Search },
  { href: "/tld-checker", label: "TLD Checker", icon: Network },
  { href: "/promoting", label: "Promoting", icon: Megaphone },
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
        "hidden md:flex md:flex-col md:sticky md:top-4 md:h-[calc(100vh-2rem)] shrink-0 z-30",
        "mx-3 rounded-2xl border border-border bg-gradient-to-b from-accent-primary/[0.05] to-bg-surface",
        "shadow-card transition-all duration-200 ease-in-out",
        isExpanded ? "md:w-64" : "md:w-[4.5rem]"
      )}
    >
      <div className="flex h-16 items-center gap-2 px-4 pt-4 pb-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-primary text-primary-foreground shadow-sm">
          <ShieldCheck className="h-5 w-5" />
        </div>
        {isExpanded && (
          <Link
            href="/dashboard"
            className="font-semibold text-[15px] text-text-primary tracking-tight truncate"
          >
            DomainVault
          </Link>
        )}
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={!isExpanded ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                !isExpanded && "justify-center px-0",
                isActive
                  ? "bg-accent-primary text-primary-foreground shadow-sm shadow-accent-primary/20"
                  : "text-text-muted hover:bg-accent-primary/10 hover:text-accent-primary"
              )}
            >
              <Icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0",
                  isActive ? "text-primary-foreground" : "text-text-muted"
                )}
              />
              {isExpanded && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-border p-3">
        <div className={cn("flex items-center", isExpanded ? "justify-between" : "justify-center")}>
          {isExpanded && <ThemeToggle />}
          <button
            onClick={() => setPinned(!pinned)}
            className="p-1.5 rounded-md text-text-muted hover:text-accent-primary hover:bg-accent-primary/10 transition-colors"
            aria-label={pinned ? "Unpin sidebar" : "Pin sidebar"}
          >
            {pinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
          </button>
        </div>
        {isExpanded && (
          <div className="mt-2">
            <SidebarFooter />
          </div>
        )}
      </div>
    </aside>
  );
}
