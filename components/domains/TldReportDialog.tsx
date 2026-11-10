"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { loadReportFromCache } from "@/lib/tld-checker/report";

interface TldReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CachedReport {
  generatedAt: string;
  text: string;
}

export function TldReportDialog({ open, onOpenChange }: TldReportDialogProps) {
  const [report, setReport] = useState<CachedReport | null>(null);

  useEffect(() => {
    if (open) {
      setReport(loadReportFromCache());
    }
  }, [open]);

  const handleCopy = async () => {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(report.text);
    } catch {
      // clipboard unavailable — ignore
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm">TLD Sync Report</DialogTitle>
        </DialogHeader>

        {report ? (
          <>
            <pre className="max-h-96 overflow-auto rounded-md border border-border bg-bg-elevated p-3 text-xs font-mono whitespace-pre-wrap">
              {report.text}
            </pre>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="font-mono text-xs"
              >
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="font-mono text-xs"
              >
                Close
              </Button>
            </div>
          </>
        ) : (
          <div className="py-4 text-center text-sm text-muted-foreground font-mono">
            No report yet — run &quot;Sync TLDs&quot; first.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
