import Link from "next/link";
import { ArrowLeft, Search, Network } from "lucide-react";

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary font-sans">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/tools"
              className="flex items-center gap-2 font-display text-lg font-bold"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-primary text-white text-xs font-bold">
                DV
              </div>
              <span className="text-lg">Free Tools</span>
            </Link>
            <nav className="hidden sm:flex items-center gap-1 text-sm">
              <Link
                href="/tools/dns-checker"
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
              >
                <Search className="h-3.5 w-3.5" />
                DNS Checker
              </Link>
              <Link
                href="/tools/tld-checker"
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
              >
                <Network className="h-3.5 w-3.5" />
                TLD Checker
              </Link>
            </nav>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back Home
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        {children}
      </main>
      <footer className="border-t border-border px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-6xl text-center text-sm text-text-muted">
          &copy; {new Date().getFullYear()} DomainVault. Free domain tools — no sign-up required.
        </div>
      </footer>
    </div>
  );
}
