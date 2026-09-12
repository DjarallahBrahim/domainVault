"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  Globe,
  Upload,
  DollarSign,
  Settings,
  Wrench,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { springSnappy } from "@/lib/motion";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/domains", label: "Domains", icon: Globe },
  { href: "/tools", label: "Tools", icon: Wrench },
  { href: "/promoting", label: "Promoting", icon: Megaphone },
  { href: "/import", label: "Import", icon: Upload },
  { href: "/sales", label: "Sales", icon: DollarSign },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-50 pointer-events-none px-3 pb-[max(env(safe-area-inset-bottom),0.6rem)]">
      <nav className="pointer-events-auto material mx-auto flex items-center justify-between rounded-2xl border border-border/50 px-1.5 py-1 shadow-float">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-xl px-2 py-1.5 text-[10px] font-medium transition-colors duration-150",
                isActive ? "text-accent-primary" : "text-text-muted"
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="bottom-tab-active"
                  transition={springSnappy}
                  className="absolute inset-x-1 top-0.5 bottom-0.5 rounded-lg bg-foreground/5"
                />
              )}
              <span className="relative flex h-6 items-center justify-center">
                <Icon className="h-5 w-5" />
              </span>
              {isActive && <span className="relative mt-0.5">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
