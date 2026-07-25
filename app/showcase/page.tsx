"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, X, Tag, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShowcaseCard } from "@/components/landing/showcase-card";

interface ShowcaseDomain {
  domain: string;
  notes: string | null;
  tags: string[] | null;
  bin: number | null;
}

export default function ShowcasePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [domains, setDomains] = useState<ShowcaseDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const search = searchParams.get("search") ?? "";
  const tags = searchParams.get("tags") ?? "";
  const minPrice = searchParams.get("minPrice") ?? "";
  const maxPrice = searchParams.get("maxPrice") ?? "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Number(searchParams.get("pageSize")) || 50;

  const [searchValue, setSearchValue] = useState(search);

  const fetchDomains = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (tags) params.set("tags", tags);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));

      const res = await fetch(`/api/showcase?${params.toString()}`);
      const data = await res.json();
      setDomains(data?.domains ?? []);
      setTotal(data?.total ?? 0);
      setTotalPages(data?.totalPages ?? 0);
    } finally {
      setLoading(false);
    }
  }, [search, tags, minPrice, maxPrice, page, pageSize]);

  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  useEffect(() => {
    fetch("/api/showcase?pageSize=1000")
      .then((r) => r.json())
      .then((data) => {
        const tagSet = new Set<string>();
        for (const d of data?.domains ?? []) {
          if (d.tags) for (const t of d.tags) tagSet.add(t);
        }
        setAllTags(Array.from(tagSet).sort());
      });
  }, []);

  function updateFilters(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    if (!("page" in updates)) params.set("page", "1");
    router.push(`/showcase?${params.toString()}`);
  }

  function updatePage(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/showcase?${params.toString()}`);
  }

  function triggerSearch() {
    updateFilters({ search: searchValue.trim() });
  }

  function clearAll() {
    setSearchValue("");
    router.push("/showcase");
  }

  const hasFilters = search || tags || minPrice || maxPrice;
  const selectedTags = tags ? tags.split(",") : [];

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary font-sans">
      {/* Nav */}
      <nav className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="/" className="flex items-center gap-2 font-display text-lg font-bold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-primary text-white text-sm font-bold">
              DV
            </div>
            <span className="text-xl">DomainVault</span>
          </a>
          <div className="flex items-center gap-3">
            <a href="/login" className="text-sm font-medium text-text-muted hover:text-text-primary">
              Sign In
            </a>
            <a
              href="/register"
              className="inline-flex items-center justify-center rounded-md bg-accent-primary text-white text-sm font-medium h-9 px-4"
            >
              Sign Up
            </a>
          </div>
        </div>
      </nav>

      <section className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold sm:text-4xl mb-2">
                Featured Domains
              </h1>
              <p className="text-text-muted">
                Browse hand-picked domains available for acquisition
              </p>
            </div>
            {!loading && (
              <p className="text-sm text-text-muted">
                {total} domain{total !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                placeholder="Search by domain name..."
                value={searchValue}
                onChange={(e) => {
                  setSearchValue(e.target.value);
                  if (!e.target.value) updateFilters({ search: "" });
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") triggerSearch();
                }}
                className="pl-9 pr-9 h-11"
              />
              {searchValue && (
                <button
                  onClick={() => {
                    setSearchValue("");
                    updateFilters({ search: "" });
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Min $"
                value={minPrice}
                onChange={(e) => updateFilters({ minPrice: e.target.value })}
                className="w-28 h-11 text-sm"
              />
              <span className="text-text-muted text-sm">–</span>
              <Input
                type="number"
                placeholder="Max $"
                value={maxPrice}
                onChange={(e) => updateFilters({ maxPrice: e.target.value })}
                className="w-28 h-11 text-sm"
              />
            </div>

            {hasFilters && (
              <Button variant="outline" size="default" onClick={clearAll} className="h-11">
                <X className="h-4 w-4 mr-1.5" />
                Clear Filters
              </Button>
            )}
          </div>

          {/* Tags list */}
          {allTags.length > 0 && (
            <div className="mb-10 p-4 rounded-xl border border-border bg-bg-surface">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="h-4 w-4 text-text-muted" />
                <span className="text-sm font-medium text-text-primary">Tags</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => {
                        const next = selectedTags.includes(tag)
                          ? selectedTags.filter((t) => t !== tag)
                          : [...selectedTags, tag];
                        updateFilters({ tags: next.join(",") });
                      }}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition ${
                        active
                          ? "border-accent-primary bg-accent-primary text-white"
                          : "border-border bg-bg-elevated text-text-muted hover:text-text-primary hover:border-text-muted"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Results */}
          <div className="mt-10">
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-bg-surface p-6 space-y-3">
                  <Skeleton className="h-7 w-2/3 mx-auto" />
                  <Skeleton className="h-5 w-1/2 mx-auto" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-6 w-1/3 mx-auto" />
                </div>
              ))}
            </div>
          ) : domains.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-text-muted text-lg">
                {hasFilters ? "No domains match your filters" : "No featured domains yet"}
              </p>
            </div>
          ) : (
            <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {domains.map((d) => (
                <ShowcaseCard
                  key={d.domain}
                  domain={d.domain}
                  notes={d.notes}
                  tags={d.tags}
                  bin={d.bin}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-text-muted">Per page</span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(v) => updateFilters({ pageSize: v })}
                  >
                    <SelectTrigger className="w-20 h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updatePage(page - 1)}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </Button>
                  <span className="px-3 text-sm text-text-muted">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updatePage(page + 1)}
                    disabled={page >= totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            </>
          )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-text-muted">
            &copy; {new Date().getFullYear()} DomainVault. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="/login" className="text-sm text-text-muted hover:text-text-primary">
              Sign In
            </a>
            <a href="/register" className="text-sm text-text-muted hover:text-text-primary">
              Sign Up
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
