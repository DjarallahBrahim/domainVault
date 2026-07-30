"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

interface ExportButtonProps {
  buildCsv: () => string;
  disabled: boolean;
}

export function ExportButton({ buildCsv, disabled }: ExportButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleExport = useCallback(async () => {
    const csv = buildCsv();

    try {
      await navigator.clipboard.writeText(csv);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "tld-results.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [buildCsv]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={disabled}
      className="font-mono text-xs"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5" />
          copied
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          Copy CSV
        </>
      )}
    </Button>
  );
}
