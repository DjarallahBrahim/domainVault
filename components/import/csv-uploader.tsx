"use client";

import { useCallback, useState, useRef } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";

interface CsvUploaderProps {
  onFileReady: (file: File) => void;
  onContentReady: (content: string, filename: string) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const CSV_HEADER = "domain,expiration_date,purchase_price,registrar,notes,tags";

export function CsvUploader({
  onFileReady,
  onContentReady,
  disabled = false,
}: CsvUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [pasteValue, setPasteValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      if (!file.name.toLowerCase().endsWith(".csv")) {
        toast.error("Invalid file type", {
          description: "Only .csv files are accepted.",
        });
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error("File too large", {
          description: "Maximum file size is 10 MB.",
        });
        return;
      }

      onFileReady(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === "string") {
          let content = text;
          if (content.charCodeAt(0) === 0xfeff) {
            content = content.slice(1);
          }
          onContentReady(content, file.name);
        } else {
          toast.error("Could not read file", {
            description: "The file appears to be empty or unreadable.",
          });
        }
      };
      reader.onerror = () => {
        toast.error("Could not read file", {
          description: "An error occurred while reading the file.",
        });
      };
      reader.readAsText(file, "UTF-8");
    },
    [onFileReady, onContentReady]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [disabled, processFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [disabled, processFile]
  );

  const handlePasteImport = useCallback(() => {
    const raw = pasteValue.trim();
    if (!raw) return;

    const lines = raw.split("\n").filter((l) => l.trim() !== "");
    if (lines.length === 0) {
      toast.error("No data to import", {
        description: "Paste at least one row of CSV data.",
      });
      return;
    }

    const invalid = lines.some((l) => !l.includes(","));
    if (invalid) {
      toast.error("Invalid format", {
        description:
          "Each line must be comma-separated. Example: acme.com, 2025-12-31, GoDaddy, client1",
      });
      return;
    }

    const content = CSV_HEADER + "\n" + lines.join("\n");
    onContentReady(content, "pasted-data.csv");
  }, [pasteValue, onContentReady]);

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-0">
      {/* ── Left: Paste CSV text ── */}
      <div className="rounded-lg border border-border bg-bg-surface p-6 flex flex-col">
        <p className="text-sm font-medium text-text-primary mb-2">
          Paste CSV text
        </p>
        <p className="text-xs text-text-muted mb-2">
          Expected format (no header needed):
          <br />
          <code className="text-[11px] bg-bg-elevated px-1 rounded">
            domain, expiration_date, purchase_price, registrar, notes, tags
          </code>
          <br />
          <span className="text-[10px]">
            Required: <strong>domain</strong>, <strong>expiration_date</strong>. Other columns are optional.
          </span>
        </p>
        <p className="text-xs text-text-muted mb-3">
          Example:
          <br />
          <code className="text-[11px] bg-bg-elevated px-1 rounded">
            acme.com, 2025-12-31, 16.00, GoDaddy, client renewal, client1
            <br />
            store.io, 2026-06-15, , Namecheap, ,
          </code>
        </p>
        <textarea
          className="flex-1 min-h-[140px] w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary resize-y font-mono"
          placeholder={
            "acme.com, 2025-12-31, 16.00, GoDaddy, client renewal, client1\nstore.io, 2026-06-15, , Namecheap, ,"
          }
          value={pasteValue}
          onChange={(e) => setPasteValue(e.target.value)}
          disabled={disabled}
        />
        <button
          onClick={handlePasteImport}
          disabled={disabled || pasteValue.trim() === ""}
          className="mt-3 w-full rounded-md bg-accent-primary px-4 py-2 text-sm font-medium text-white hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Import
        </button>
      </div>

      {/* ── Center: Divider ── */}
      <div className="flex flex-col items-center justify-center px-4">
        <div className="w-px flex-1 bg-border" />
        <span className="text-xs text-text-muted font-medium py-3">or</span>
        <div className="w-px flex-1 bg-border" />
      </div>

      {/* ── Right: Upload CSV file ── */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center ${
          disabled
            ? "border-border opacity-50 cursor-not-allowed"
            : isDragOver
              ? "border-accent-primary bg-accent-primary/5"
              : "border-border hover:border-text-muted"
        }`}
      >
        <Upload className="mx-auto h-10 w-10 text-text-muted mb-3" />
        <p className="text-sm text-text-primary font-medium">
          Drag and drop your CSV file here
        </p>
        <p className="text-xs text-text-muted mt-1">
          or click to browse — .csv files only, max 10 MB
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleChange}
          className="hidden"
          disabled={disabled}
        />
      </div>
    </div>
  );
}
