/**
 * Text report for global TLD syncs (new TLDs / deleted websites).
 *
 * For now the report is plain text cached in localStorage — structured
 * persistence (DB table) can be added later without changing the builders.
 */

export interface TldReportNewTld {
  fullDomain: string;
  isLive: boolean;
}

export interface TldReportEntry {
  domain: string;
  /** Variants newly reserved after the sync (live and offline alike). */
  newTlds: TldReportNewTld[];
  /** Variants whose website was live before the sync but is not anymore. */
  deletedWebsites: string[];
}

export interface TldReport {
  generatedAt: string;
  scope: "all" | "page";
  domainCount: number;
  tldCount: number;
  entries: TldReportEntry[];
}

const STORAGE_KEY = "tld-sync-report";

export function buildReportText(report: TldReport): string {
  const lines: string[] = [];

  const generatedAt = new Date(report.generatedAt);
  lines.push(`TLD Sync Report — ${generatedAt.toLocaleString()}`);
  lines.push(
    `Scope: ${report.scope} · ${report.domainCount} domain${
      report.domainCount === 1 ? "" : "s"
    } · ${report.tldCount} TLDs`
  );
  lines.push("");

  for (const entry of report.entries) {
    lines.push(entry.domain);

    if (entry.newTlds.length > 0) {
      const rendered = entry.newTlds.map((tld) =>
        tld.isLive ? tld.fullDomain : `${tld.fullDomain} (offline)`
      );
      lines.push(`  + new TLDs (${entry.newTlds.length}): ${rendered.join(", ")}`);
    }
    if (entry.deletedWebsites.length > 0) {
      lines.push(
        `  - deleted websites (${entry.deletedWebsites.length}): ${entry.deletedWebsites.join(", ")}`
      );
    }
    if (entry.newTlds.length === 0 && entry.deletedWebsites.length === 0) {
      lines.push("  no changes");
    }
    lines.push("");
  }

  const totalNew = report.entries.reduce((sum, e) => sum + e.newTlds.length, 0);
  const totalDeleted = report.entries.reduce((sum, e) => sum + e.deletedWebsites.length, 0);
  lines.push("---");
  lines.push(
    `Totals: ${totalNew} new TLD${totalNew === 1 ? "" : "s"}, ${totalDeleted} deleted website${
      totalDeleted === 1 ? "" : "s"
    }`
  );

  return lines.join("\n");
}

interface StoredReport {
  generatedAt: string;
  text: string;
}

export function saveReportToCache(report: TldReport, text: string): void {
  if (typeof window === "undefined") return;
  const stored: StoredReport = { generatedAt: report.generatedAt, text };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // storage full / unavailable — report is best-effort
  }
}

export function loadReportFromCache(): StoredReport | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredReport;
    if (typeof parsed?.text !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}
