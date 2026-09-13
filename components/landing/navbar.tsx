import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "./shared";
import { navLinks } from "./data";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function NavBar({
  ctaHref,
  isAuthenticated,
}: {
  ctaHref: string;
  isAuthenticated: boolean;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-deep"
          >
            {isAuthenticated ? "Dashboard" : "Get started"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
