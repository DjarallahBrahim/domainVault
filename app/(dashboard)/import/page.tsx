"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Papa from "papaparse";
import { toast } from "sonner";
import { Download } from "lucide-react";

import { CsvUploader } from "@/components/import/csv-uploader";
import { CsvOptionToggle } from "@/components/import/csv-option-toggle";
import { CsvProgress } from "@/components/import/csv-progress";
import { CsvSummary } from "@/components/import/csv-summary";
import { ManualEntryTab } from "@/components/import/manual-entry-tab";
import { Card, CardContent } from "@/components/ui/card";
import { queryKeys } from "@/lib/query-keys";
import {
  checkExistingDomains,
  upsertDomains,
  type UpsertRow,
} from "@/lib/supabase/queries/domains-client";
import {
  createImportLog,
  type ImportError,
} from "@/lib/supabase/queries/import-logs-client";
import { csvRowSchema, parseDate, parseTags } from "@/lib/validations/domain";

type ImportPhase = "select" | "parsing" | "importing" | "done";
type ActiveTab = "csv" | "manual";

interface ImportResult {
  filename: string;
  imported: number;
  skipped: number;
  errors: ImportError[];
}

const CSV_HEADER = "domain,price,registrar,expiration_date,purchase_price";

const SAMPLE_CSV = [
  CSV_HEADER,
  "premium-saas.com,4999,Sav,2027-06-15,2500",
  "crypto-wallet.io,1999,Namecheap,2027-12-01,800",
  "ai-toolkit.dev,3500,GoDaddy,2027-03-10,1200",
  "luxury-travel.co,12000,Spaceship,2027-01-20,3000",
].join("\n");

function downloadSampleCsv() {
  const blob = new Blob(["\uFEFF" + SAMPLE_CSV], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "dnfly-import-template.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function ImportPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<ImportPhase>("select");
  const [mode, setMode] = useState<"skip" | "update">("skip");
  const [progress, setProgress] = useState({
    parsedRows: 0,
    currentRow: 0,
    totalRows: 0,
  });
  const [result, setResult] = useState<ImportResult | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("csv");

  const importMutation = useMutation({
    mutationFn: async ({
      rows,
      mode: importMode,
      filename,
    }: {
      rows: UpsertRow[];
      mode: "skip" | "update";
      filename: string;
    }) => {
      const normalized = rows.map((r) => r.domain.trim().toLowerCase());
      const uniqueNorm = [...new Set(normalized)];
      const existing = await checkExistingDomains(uniqueNorm);

      const toImport: UpsertRow[] = [];
      const errors: ImportError[] = [];
      const skippedRows: number[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const norm = row.domain.trim().toLowerCase();

        if (existing.has(norm)) {
          if (importMode === "skip") {
            skippedRows.push(i + 1);
            continue;
          }
        }

        toImport.push(row);
      }

      setProgress((p) => ({ ...p, currentRow: 0, totalRows: toImport.length }));

      if (toImport.length > 0) {
        await upsertDomains(toImport, importMode);
      }

      await createImportLog({
        filename,
        total_rows: rows.length - errors.length + errors.length,
        imported: toImport.length,
        skipped: skippedRows.length,
        errors: errors.length > 0 ? errors : null,
      });

      return {
        filename,
        imported: toImport.length,
        skipped: skippedRows.length,
        errors,
      };
    },
    onSuccess: (data) => {
      setPhase("done");
      setResult(data);
      queryClient.invalidateQueries({ queryKey: queryKeys.domains.lists() });
      toast.success("Import complete", {
        description: `${data.imported} imported, ${data.skipped} skipped, ${data.errors.length} errors`,
      });
    },
    onError: (error: Error) => {
      setPhase("select");
      toast.error("Import failed", {
        description: error.message,
      });
    },
  });

  const handleContentReady = useCallback(
    (content: string, filename: string) => {
      setPhase("parsing");

      Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h: string) => h.trim().toLowerCase(),
        transform: (v: string) => v?.trim() ?? v,
        complete: (results) => {
          const rows = results.data as Record<string, string>[];
          const headers = results.meta.fields ?? [];

          if (!headers.includes("domain") || !headers.includes("expiration_date")) {
            toast.error("Missing required columns", {
              description:
                "CSV must include 'domain' and 'expiration_date' columns.",
            });
            setPhase("select");
            return;
          }

          const errors: ImportError[] = [];
          const validRows: UpsertRow[] = [];

          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const validation = csvRowSchema.safeParse(row);

            if (!validation.success) {
              for (const issue of validation.error.issues) {
                errors.push({
                  row: i + 1,
                  field: issue.path.join("."),
                  message: issue.message,
                });
              }
              continue;
            }

            const parsed = validation.data;
            validRows.push({
              domain: parsed.domain,
              expiration_date: parseDate(parsed.expiration_date),
              purchase_price:
                parsed.purchase_price && parsed.purchase_price.trim()
                  ? Number(parsed.purchase_price)
                  : null,
              bin:
                parsed.bin && parsed.bin.trim()
                  ? Number(parsed.bin)
                  : parsed.price && parsed.price.trim()
                    ? Number(parsed.price)
                    : null,
              registrar: parsed.registrar?.trim() || null,
              notes: parsed.notes?.trim() || null,
              tags: parseTags(parsed.tags),
            });
          }

          setProgress({
            parsedRows: rows.length,
            currentRow: 0,
            totalRows: validRows.length,
          });

          if (validRows.length === 0 && errors.length === 0) {
            toast.info("No data", {
              description: "The CSV file contains no data rows.",
            });
            setPhase("select");
            return;
          }

          setPhase("importing");
          importMutation.mutate({
            rows: validRows,
            mode,
            filename,
          });
        },
        error: (error: Error) => {
          toast.error("CSV parsing failed", {
            description: error.message,
          });
          setPhase("select");
        },
      });
    },
    [mode, importMutation]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Import</h1>
        <p className="text-text-muted mt-1">
          Upload a CSV file or add domains manually
        </p>
      </div>

      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => { setActiveTab("csv"); setPhase("select"); setResult(null); }}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-[1px] transition-colors ${
            activeTab === "csv"
              ? "border-accent-primary text-accent-primary"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          CSV Upload
        </button>
        <button
          onClick={() => { setActiveTab("manual"); setPhase("select"); setResult(null); }}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-[1px] transition-colors ${
            activeTab === "manual"
              ? "border-accent-primary text-accent-primary"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          Add Manually
        </button>
      </div>

      {activeTab === "csv" && (
        <>
          <div className="rounded-xl border border-accent-warning/30 bg-accent-warning/10 p-4">
            <p className="text-sm font-semibold text-text-primary">
              Heads up: this is the most important — and honestly the most
              annoying — step 😅
            </p>
            <p className="text-sm text-text-muted mt-1">
              Sorry, but there&apos;s no way around it: no CSV, no portfolio. We
              literally can&apos;t show you anything until your domains are in
              here. Do it once now and you&apos;re set forever 😂
            </p>
          </div>

          <div className="rounded-md bg-bg-elevated border border-border p-4">
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-sm font-medium text-text-primary">CSV Format</p>
                <p className="text-xs text-text-muted mt-0.5">
                  Required:{" "}
                  <span className="text-text-primary">
                    domain, expiration_date
                  </span>{" "}
                  &middot; Optional: price, registrar, purchase_price
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={downloadSampleCsv}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-accent-primary text-white font-medium hover:bg-accent-primary/90 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download template CSV
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(CSV_HEADER);
                    toast.success("Header copied to clipboard");
                  }}
                  className="text-xs px-2.5 py-1.5 rounded-md bg-bg-surface border border-border text-text-muted hover:text-text-primary transition-colors"
                >
                  Copy header
                </button>
              </div>
              <p className="text-xs text-text-muted">
                Not sure where to start? Grab the template — it has the exact
                columns and a few example rows you can replace.
              </p>
            </div>
          </div>

          {phase === "select" && (
        <Card>
          <CardContent className="space-y-6 pt-6">
            <CsvOptionToggle
              mode={mode}
              onModeChange={setMode}
              disabled={importMutation.isPending}
            />
            <CsvUploader
              onFileReady={() => {}}
              onContentReady={handleContentReady}
              disabled={importMutation.isPending}
            />
          </CardContent>
        </Card>
      )}

      {(phase === "parsing" || phase === "importing") && (
        <Card>
          <CardContent className="pt-6">
            <CsvProgress
              phase={phase === "parsing" ? "parsing" : "importing"}
              parsedRows={progress.parsedRows}
              currentRow={progress.currentRow}
              totalRows={progress.totalRows}
            />
          </CardContent>
        </Card>
      )}

      {phase === "done" && result && (
        <>
          <CsvSummary
            filename={result.filename}
            imported={result.imported}
            skipped={result.skipped}
            errors={result.errors}
          />
          <div className="flex gap-3">
            <button
              onClick={() => {
                setPhase("select");
                setResult(null);
              }}
              className="px-4 py-2 rounded-md bg-accent-primary text-white text-sm font-medium hover:bg-accent-primary/90 transition-colors"
            >
              Import Another File
            </button>
            <button
              onClick={() => router.push("/domains")}
              className="px-4 py-2 rounded-md bg-bg-elevated text-text-primary text-sm font-medium hover:bg-bg-elevated/80 transition-colors"
            >
              View Domains
            </button>
          </div>
        </>
      )}
        </>
      )}

      {activeTab === "manual" && (
        <Card>
          <CardContent className="pt-6">
            <ManualEntryTab />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
