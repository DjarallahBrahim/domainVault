"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Network, Shield, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { DnsCheckerContent } from "@/components/dns-checker/DnsCheckerContent";
import { TldCheckerContent } from "@/components/tld-checker/TldCheckerContent";

type ToolId = "dns" | "tld";

const TOOLS = [
  {
    value: "dns" as const,
    icon: Search,
    title: "DNS Checker",
    description:
      "Bulk DNS lookup tool — resolve A records via Cloudflare or Google. Paste a list of domains and instantly see which ones have DNS configured.",
    features: [
      "Bulk A record resolution",
      "Cloudflare & Google DNS",
      "Compare mode",
      "CSV export",
      "TLD replacement",
    ],
  },
  {
    value: "tld" as const,
    icon: Network,
    title: "TLD Checker",
    description:
      "Check domain availability across hundreds of TLDs. Enter your brand name and find the best available extensions in seconds.",
    features: [
      "Check 50+ TLDs at once",
      "Live availability",
      "Filter by status",
      "CSV export",
      "Custom TLD support",
    ],
  },
];

export function ToolsView({ initialTool }: { initialTool: ToolId }) {
  const router = useRouter();
  const [tool, setTool] = useState<ToolId>(initialTool);

  useEffect(() => {
    setTool(initialTool);
  }, [initialTool]);

  function selectTool(value: ToolId) {
    setTool(value);
    router.replace(value === "dns" ? "/tools" : `/tools?tool=${value}`, { scroll: false });
    document.getElementById("tool-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-large-title text-text-primary">Tools</h1>
        <p className="mt-1 text-sm text-text-muted">
          Pick a tool below — everything runs in your browser.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {TOOLS.map((t) => {
          const selected = tool === t.value;
          const Icon = t.icon;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => selectTool(t.value)}
              aria-pressed={selected}
              className={cn(
                "flex flex-col rounded-2xl border bg-bg-surface p-5 text-left transition-all",
                selected
                  ? "border-accent-primary shadow-card ring-1 ring-accent-primary"
                  : "border-border hover:border-accent-primary/40 hover:shadow-card"
              )}
            >
              <span className="mb-3 flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-primary/10">
                  <Icon className="h-5 w-5 text-accent-primary" />
                </span>
                {selected && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">
                    <Check className="h-3 w-3" />
                    Active
                  </span>
                )}
              </span>
              <span className="font-display text-lg font-semibold">{t.title}</span>
              <span className="mt-1.5 flex-1 text-sm leading-relaxed text-text-muted">
                {t.description}
              </span>
              <span className="mt-3 flex flex-wrap gap-1.5">
                {t.features.map((f) => (
                  <span
                    key={f}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[11px] font-mono text-text-muted"
                  >
                    <Shield className="h-2.5 w-2.5" />
                    {f}
                  </span>
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <div id="tool-panel" className="scroll-mt-24">
        {tool === "dns" ? <DnsCheckerContent /> : <TldCheckerContent />}
      </div>
    </div>
  );
}
