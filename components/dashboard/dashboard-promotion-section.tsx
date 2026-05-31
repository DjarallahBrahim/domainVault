"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { PromotionRow } from "@/components/ui/promotion-row";
import {
  fetchCandidates,
  fetchPromotionStats,
  recordPromotion,
  searchByKeywords,
  type BucketKey,
  BUCKETS,
} from "@/lib/promotions";
import { Search, RefreshCw } from "lucide-react";

type Domain = { id: string; domain: string; expiration_date: string };
type Stats = Record<string, { count: number; lastAt: string }>;

export function PromotionSection() {
  const supabase = createClient();

  const [activeBucket, setActiveBucket] = useState<BucketKey | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [stats, setStats] = useState<Stats>({});
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [previousBucket, setPreviousBucket] = useState<BucketKey | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchMode) {
      searchInputRef.current?.focus();
    }
  }, [searchMode]);

  async function load(bucket: BucketKey) {
    setLoading(true);
    setConfirming(null);
    try {
      const candidates = await fetchCandidates(supabase, bucket);
      const ids = candidates.map((c) => c.id);
      const statsData = ids.length > 0
        ? await fetchPromotionStats(supabase, ids)
        : {};
      setDomains(candidates);
      setStats(statsData);
      setActiveBucket(bucket);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(rawQuery: string) {
    const normalized = rawQuery.replace(/,\s*/g, ",").replace(/\s+/g, ", ");
    const keywords = normalized
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    if (keywords.length === 0) return;

    setLoading(true);
    setConfirming(null);
    try {
      const data = await searchByKeywords(supabase, keywords);
      const ids = data.map((c) => c.id);
      const statsData = ids.length > 0
        ? await fetchPromotionStats(supabase, ids)
        : {};
      setDomains(data);
      setStats(statsData);
      setActiveBucket(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Search failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function enterSearchMode() {
    setPreviousBucket(activeBucket);
    setSearchMode(true);
  }

  function exitSearchMode() {
    setSearchMode(false);
    setSearchQuery("");
    if (previousBucket) {
      load(previousBucket);
    }
  }

  async function handlePromote(domainId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Not authenticated"); return; }
      await recordPromotion(supabase, user.id, domainId);

      setStats((prev) => {
        const existing = prev[domainId] ?? { count: 0, lastAt: "" };
        return {
          ...prev,
          [domainId]: {
            count: existing.count + 1,
            lastAt: new Date().toISOString(),
          },
        };
      });
      setConfirming(null);
      toast.success("Promoted ✓");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed";
      toast.error(msg);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-bg-surface p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Domains to Promote</h3>
        {activeBucket && (
          <button
            onClick={() => load(activeBucket)}
            disabled={loading}
            className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-4 items-center">
        <div
          className={`flex gap-2 transition-all duration-300 ease-in-out ${
            searchMode
              ? "opacity-0 -translate-x-2 pointer-events-none w-0 overflow-hidden"
              : "opacity-100 translate-x-0 w-auto"
          }`}
        >
          {BUCKETS.map((b) => (
            <button
              key={b.key}
              onClick={() => load(b.key)}
              disabled={loading}
              className={`px-3 py-1.5 rounded-md text-sm border transition whitespace-nowrap ${
                activeBucket === b.key
                  ? "bg-accent-primary text-white border-accent-primary"
                  : "border-border hover:bg-bg-elevated text-text-muted hover:text-text-primary"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>

        <div
          className={`transition-all duration-300 ease-in-out ${
            searchMode
              ? "opacity-100 translate-x-0"
              : "opacity-0 translate-x-2 pointer-events-none w-0 overflow-hidden"
          }`}
        >
          <input
            ref={searchInputRef}
            className="px-3 py-1.5 rounded-md text-sm border border-border bg-bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary w-[260px]"
            placeholder="Search domains (e.g. acme.com, store.io)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch(searchQuery);
            }}
            onBlur={exitSearchMode}
          />
        </div>

        {!searchMode && (
          <button
            onClick={enterSearchMode}
            disabled={loading}
            className="p-1.5 rounded-md border border-border hover:bg-bg-elevated text-text-muted hover:text-text-primary transition shrink-0"
            title="Search domains"
          >
            <Search className="h-4 w-4" />
          </button>
        )}
      </div>

      {!activeBucket && !searchMode && domains.length === 0 && (
        <p className="text-sm text-text-muted py-4">
          Select a filter above to see domains to promote.
        </p>
      )}

      {searchMode && !loading && domains.length === 0 && (
        <p className="text-sm text-text-muted py-4">
          No domains match your search.
        </p>
      )}

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {activeBucket && !loading && domains.length === 0 && (
        <p className="text-sm text-text-muted py-4">
          No active domains expiring in this range.
        </p>
      )}

      {!loading && domains.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-border">
              <th className="pb-2 font-medium text-text-muted">Domain</th>
              <th className="pb-2 font-medium text-text-muted">Expires</th>
              <th className="pb-2 font-medium text-text-muted">Promoted</th>
              <th className="pb-2 font-medium text-text-muted">Last promoted</th>
              <th className="pb-2 font-medium text-text-muted"></th>
            </tr>
          </thead>
          <tbody>
            {domains.map((domain) => (
              <PromotionRow
                key={domain.id}
                domain={domain}
                stat={stats[domain.id] ?? null}
                isConfirming={confirming === domain.id}
                onPromoteClick={() => setConfirming(domain.id)}
                onConfirm={() => handlePromote(domain.id)}
                onCancel={() => setConfirming(null)}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
