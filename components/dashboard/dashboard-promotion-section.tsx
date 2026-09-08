"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { WidgetCard } from "@/components/ui/widget-card";
import { Segmented } from "@/components/ui/segmented";
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
      const statsData = ids.length > 0 ? await fetchPromotionStats(supabase, ids) : {};
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
      const statsData = ids.length > 0 ? await fetchPromotionStats(supabase, ids) : {};
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Not authenticated");
        return;
      }
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
    <WidgetCard
      title="Domains to Promote"
      description="Pick an expiry range to build this week’s promotion list"
      action={
        activeBucket ? (
          <button
            type="button"
            onClick={() => load(activeBucket)}
            disabled={loading}
            className="flex items-center gap-1 text-xs font-medium text-text-muted transition-colors hover:text-text-primary disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        ) : undefined
      }
    >
      <div className="mb-4 flex items-center gap-3">
        {searchMode ? (
          <input
            ref={searchInputRef}
            className="w-full rounded-lg border border-border bg-bg-surface px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Search (e.g. acme.com, store.io)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch(searchQuery);
            }}
            onBlur={exitSearchMode}
          />
        ) : (
          <>
            <div className="min-w-0 overflow-x-auto">
              <Segmented
                aria-label="Promotion pool"
                options={BUCKETS.map((b) => ({ value: b.key, label: b.label }))}
                value={activeBucket}
                onChange={(v) => load(v as BucketKey)}
                size="sm"
              />
            </div>
            <button
              type="button"
              onClick={enterSearchMode}
              disabled={loading}
              className="shrink-0 rounded-lg border border-border p-1.5 text-text-muted transition-colors hover:bg-foreground/5 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              title="Search domains"
            >
              <Search className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {!activeBucket && !searchMode && domains.length === 0 && (
        <p className="py-4 text-sm text-text-muted">
          Select a filter above to see domains to promote.
        </p>
      )}

      {searchMode && !loading && domains.length === 0 && (
        <p className="py-4 text-sm text-text-muted">No domains match your search.</p>
      )}

      {activeBucket && !loading && domains.length === 0 && (
        <p className="py-4 text-sm text-text-muted">No active domains expiring in this range.</p>
      )}

      {loading && domains.length === 0 && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-foreground/5" />
          ))}
        </div>
      )}

      {!loading && domains.length > 0 && (
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full min-w-[500px] text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left">
                <th className="pb-2 font-medium text-text-muted">Domain</th>
                <th className="pb-2 font-medium text-text-muted">Expires</th>
                <th className="pb-2 font-medium text-text-muted">Promoted</th>
                <th className="pb-2 font-medium text-text-muted">Last</th>
                <th className="pb-2" />
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
        </div>
      )}
    </WidgetCard>
  );
}
