import { Logo } from "./shared";
import { navLinks } from "./data";

export function Footer() {
  return (
    <footer id="pricing" className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-8">
        <Logo className="h-7" />
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>
        <p className="text-xs text-muted-foreground">
          © 2025 DNfly.io. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
