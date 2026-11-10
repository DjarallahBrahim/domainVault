/**
 * Pure diff helpers for reserved-TLD scans.
 *
 * Kept side-effect free so the diff output can be persisted to the database
 * in the future (e.g. a `tld_scan_diffs` table) without changing callers.
 */

export interface TldStatus {
  tld: string;
  isLive: boolean;
}

export interface TldDiff {
  /** TLDs that are reserved now but were not reserved before the scan. */
  added: string[];
  /** TLDs that were reserved before the scan but no longer are. */
  removed: string[];
}

export function computeTldDiff(previous: TldStatus[], next: TldStatus[]): TldDiff {
  const previousTlds = new Set(previous.map((s) => s.tld));
  const nextTlds = new Set(next.map((s) => s.tld));

  const added: string[] = [];
  for (const status of next) {
    if (!previousTlds.has(status.tld)) added.push(status.tld);
  }

  const removed: string[] = [];
  for (const status of previous) {
    if (!nextTlds.has(status.tld)) removed.push(status.tld);
  }

  return { added, removed };
}
