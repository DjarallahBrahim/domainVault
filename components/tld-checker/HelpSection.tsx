"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export function HelpSection() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-bg-surface/50">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-4 py-3 text-sm font-mono text-muted-foreground text-left hover:bg-bg-elevated/50 transition-colors rounded-xl"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0" />
        )}
        <span className="text-muted-foreground">//</span> how to use this tool
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-4 text-sm border-t border-border pt-4">
          <div>
            <h3 className="text-foreground font-medium mb-1.5">How it works</h3>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Enter your brand or domain base words in the text area</li>
              <li>Select or deselect TLDs you want to check</li>
              <li>Add custom TLDs via the text input next to the default chips</li>
              <li>
                Click Check Availability or press{" "}
                <kbd className="px-1.5 py-0.5 rounded bg-bg-elevated border border-border text-xs font-mono text-text-primary">
                  Ctrl+Enter
                </kbd>{" "}
                (<kbd className="px-1.5 py-0.5 rounded bg-bg-elevated border border-border text-xs font-mono text-text-primary">
                  Cmd+Enter
                </kbd>{" "}
                on Mac)
              </li>
              <li>
                Results appear — click a domain to visit it, copy to CSV to share
              </li>
            </ol>
          </div>

          <div>
            <h3 className="text-foreground font-medium mb-1.5">
              Understanding statuses
            </h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>
                <strong className="text-accent-success">Available</strong> — the
                domain returns no DNS records and is likely available for
                registration
              </li>
              <li>
                <strong className="text-accent-warning">Registered</strong> —
                the domain has active name servers and is likely already
                registered
              </li>
              <li>
                <strong className="text-accent-danger">Error</strong> — the
                lookup timed out or encountered a network issue
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-foreground font-medium mb-1.5">FAQ</h3>
            <dl className="space-y-3 text-muted-foreground">
              <div>
                <dt className="font-medium text-foreground">
                  How does availability checking work?
                </dt>
                <dd className="mt-0.5">
                  The tool checks DNS name server (NS) records via Cloudflare
                  DNS. If a domain has NS records it is likely registered. If it
                  returns NXDOMAIN (domain not found) it is likely available.
                  This is a heuristic — always verify on a registrar before
                  purchasing.
                </dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">
                  What about premium or reserved domains?
                </dt>
                <dd className="mt-0.5">
                  Premium and registry-reserved domains may show as Available
                  because they lack DNS records even though they cannot be
                  registered normally. Always confirm availability on the
                  registrar directly.
                </dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">
                  What is the limit?
                </dt>
                <dd className="mt-0.5">
                  Up to 200 base words with up to 20 concurrent lookups at a
                  time. You can select as many TLDs as you like — each word ×
                  TLD combination counts as one lookup.
                </dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">
                  Is my data private?
                </dt>
                <dd className="mt-0.5">
                  Yes — all lookups happen directly from your browser to
                  Cloudflare DNS. We never see your word lists, TLD selections,
                  or results.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
