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
              <li>Paste domain names in the text area (any format)</li>
              <li>
                Choose your DNS resolver (Cloudflare or Google) or enable
                Compare Providers to use both
              </li>
              <li>
                Click Resolve or press{" "}
                <kbd className="px-1.5 py-0.5 rounded bg-bg-elevated border border-border text-xs font-mono text-text-primary">
                  Ctrl+Enter
                </kbd>{" "}
                (<kbd className="px-1.5 py-0.5 rounded bg-bg-elevated border border-border text-xs font-mono text-text-primary">
                  Cmd+Enter
                </kbd>{" "}
                on Mac)
              </li>
              <li>
                Results appear live — click IPs to copy, click domains to visit
              </li>
            </ol>
          </div>

          <div>
            <h3 className="text-foreground font-medium mb-1.5">
              Supported formats
            </h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>
                Plain:{" "}
                <code className="text-xs bg-bg-elevated px-1 rounded font-mono text-text-primary">
                  google.com
                </code>
              </li>
              <li>
                URLs:{" "}
                <code className="text-xs bg-bg-elevated px-1 rounded font-mono text-text-primary">
                  https://example.com/page
                </code>
              </li>
              <li>
                Commas:{" "}
                <code className="text-xs bg-bg-elevated px-1 rounded font-mono text-text-primary">
                  google.com, cloudflare.com
                </code>
              </li>
              <li>One per line (newlines work too)</li>
            </ul>
          </div>

          <div>
            <h3 className="text-foreground font-medium mb-1.5">FAQ</h3>
            <dl className="space-y-3 text-muted-foreground">
              <div>
                <dt className="font-medium text-foreground">
                  Why do results differ between resolvers?
                </dt>
                <dd className="mt-0.5">
                  DNS changes take time to propagate. Cloudflare and Google may
                  have different cached results.
                </dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">
                  What does &ldquo;No DNS&rdquo; mean?
                </dt>
                <dd className="mt-0.5">
                  The domain has no A (IPv4) record, or the lookup timed out
                  (after 5 seconds).
                </dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">
                  What&apos;s the limit?
                </dt>
                <dd className="mt-0.5">
                  Up to 200 domains at a time, with 20 running concurrently.
                </dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">
                  Is my data private?
                </dt>
                <dd className="mt-0.5">
                  Yes — all lookups happen directly from your browser to
                  Cloudflare/Google. We never see your domain lists or results.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
