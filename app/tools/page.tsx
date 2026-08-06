import Link from "next/link";
import { Search, Network, ArrowRight, Shield, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const tools = [
  {
    href: "/tools/dns-checker",
    icon: Search,
    title: "DNS Checker",
    description:
      "Bulk DNS lookup tool — resolve A records via Cloudflare or Google. Paste a list of domains and instantly see which ones have DNS configured.",
    features: [
      "Bulk A record resolution",
      "Cloudflare & Google DNS",
      "Compare mode (dual resolver)",
      "CSV export",
      "TLD replacement",
    ],
  },
  {
    href: "/tools/tld-checker",
    icon: Network,
    title: "TLD Checker",
    description:
      "Check domain availability across hundreds of TLDs. Enter your brand name and find the best available extensions in seconds.",
    features: [
      "Check 50+ TLDs at once",
      "Live availability results",
      "Filter by status",
      "CSV export",
      "Custom TLD support",
    ],
  },
];

export default function ToolsPage() {
  return (
    <div className="space-y-12">
      <div className="text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-bg-surface px-4 py-1.5 text-sm text-text-muted">
          <Zap className="h-3.5 w-3.5 text-accent-warning" />
          Free domain tools — no sign-up required
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Free Domain Tools
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-text-muted">
          Powerful domain analysis tools that work without an account. Just paste your domains and go.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {tools.map((tool) => (
          <div
            key={tool.href}
            className="rounded-xl border border-border bg-bg-surface p-6 transition-shadow hover:shadow-lg flex flex-col"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-primary/10">
              <tool.icon className="h-6 w-6 text-accent-primary" />
            </div>
            <h2 className="font-display text-xl font-semibold">{tool.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-text-muted flex-1">
              {tool.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {tool.features.map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[11px] text-text-muted font-mono"
                >
                  <Shield className="h-2.5 w-2.5" />
                  {f}
                </span>
              ))}
            </div>
            <Link
              href={tool.href}
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "mt-6 gap-2 self-start"
              )}
            >
              Open {tool.title}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
