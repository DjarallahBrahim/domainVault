"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Search, X, Download, SlidersHorizontal, ChevronDown } from "lucide-react";

const EXPIRY_MAX_MONTHS = 12;

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
  { value: "pending", label: "Pending" },
] as const;

interface DomainSearchProps {
  tlds: string[];
  registrars: string[];
  onExport?: () => void;
}

export function DomainSearch({ tlds, registrars, onExport }: DomainSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlSearch = searchParams.get("search") ?? "";
  const currentStatus = searchParams.get("status") ?? "all";
  const currentTld = searchParams.get("tld") ?? "";
  const currentExpiry = searchParams.get("expiry") ?? "";
  const currentExpiryMin = searchParams.get("expiryMin") ?? "";
  const currentExpiryMax = searchParams.get("expiryMax") ?? "";
  const currentCreated = searchParams.get("created") ?? "";
  const currentRegistrars = searchParams.get("registrar") ?? "";
  const currentRenewal = searchParams.get("renewal") ?? "";
  const currentRenewed = searchParams.get("renewed") ?? "";
  const currentNotListed = searchParams.get("notListed") ?? "";
  const currentLander = searchParams.get("lander") ?? "";
  const currentShows = searchParams.get("shows") ?? "";
  const showMethods = currentShows
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const notListedPlatforms = currentNotListed
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const [searchValue, setSearchValue] = useState(urlSearch.replace(/,/g, " "));
  const [expiryMin, setExpiryMin] = useState(currentExpiryMin);
  const [expiryMax, setExpiryMax] = useState(currentExpiryMax);
  const [expiryRange, setExpiryRange] = useState<[number, number]>([
    currentExpiryMin === "" ? 0 : Number(currentExpiryMin),
    currentExpiryMax === "" ? EXPIRY_MAX_MONTHS : Number(currentExpiryMax),
  ]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setExpiryRange([
      expiryMin === "" ? 0 : Number(expiryMin),
      expiryMax === "" ? EXPIRY_MAX_MONTHS : Number(expiryMax),
    ]);
  }, [expiryMin, expiryMax]);

  const updateParam = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      params.set("page", "1");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const commitExpiry = useCallback(
    ([lo, hi]: number[]) => {
      const nextMin = lo <= 0 ? "" : String(lo);
      const nextMax = hi >= EXPIRY_MAX_MONTHS ? "" : String(hi);
      setExpiryMin(nextMin);
      setExpiryMax(nextMax);
      updateParam({ expiryMin: nextMin, expiryMax: nextMax });
    },
    [updateParam]
  );

  const expiryLabel =
    expiryRange[0] <= 0 && expiryRange[1] >= EXPIRY_MAX_MONTHS
      ? "Any expiry"
      : `${expiryRange[0]}–${expiryRange[1]} months`;

  function triggerSearch() {
    const val = searchValue.trim().replace(/\s+/g, ",");
    const params = new URLSearchParams(searchParams.toString());
    if (val) {
      params.set("search", val);
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearAll() {
    setSearchValue("");
    setExpiryMin("");
    setExpiryMax("");
    const params = new URLSearchParams();
    const pageSize = searchParams.get("pageSize");
    if (pageSize) params.set("pageSize", pageSize);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  const hasFilters =
    urlSearch ||
    currentStatus !== "all" ||
    currentTld ||
    currentExpiry ||
    currentExpiryMin ||
    currentExpiryMax ||
    currentCreated ||
    currentRegistrars ||
    currentRenewal ||
    currentRenewed ||
    currentNotListed ||
    currentLander ||
    currentShows;

  const activeFilterCount = [
    currentStatus !== "all" ? currentStatus : "",
    currentTld,
    currentExpiry || currentExpiryMin || currentExpiryMax ? "expiry" : "",
    currentCreated,
    currentRegistrars,
    currentRenewal,
    currentRenewed,
    currentNotListed ? "notListed" : "",
    currentLander,
    currentShows,
  ].filter(Boolean).length;

  function toggleNotListed(platform: string) {
    const next = new Set(notListedPlatforms);
    if (next.has(platform)) next.delete(platform);
    else next.add(platform);
    updateParam({ notListed: Array.from(next).join(",") });
  }

  function toggleShowMethod(method: string) {
    const next = new Set(showMethods);
    if (next.has(method)) next.delete(method);
    else next.add(method);
    updateParam({ shows: Array.from(next).join(",") });
  }

  const sectionLabel = "text-[11px] font-medium tracking-wide text-text-muted";

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-4 md:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input
              placeholder="Search domains (comma or space to separate)"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") triggerSearch();
              }}
              className="pl-9 pr-9 h-11 rounded-lg"
            />
            {searchValue && (
              <button
                onClick={() => {
                  setSearchValue("");
                  updateParam({ search: "" });
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex gap-2 shrink-0">
            <Button onClick={triggerSearch} className="h-11 flex-1 sm:flex-none">
              <Search className="h-4 w-4 mr-1.5" />
              Search
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFilters((v) => !v)}
              aria-expanded={showFilters}
              className="h-11 flex-1 sm:flex-none"
            >
              <SlidersHorizontal className="h-4 w-4 mr-1.5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-primary px-1.5 text-[11px] font-semibold text-white tabular-nums">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown
                className={cn(
                  "h-4 w-4 ml-1 transition-transform duration-200",
                  showFilters && "rotate-180"
                )}
              />
            </Button>
            <Button variant="outline" onClick={onExport} className="h-11 flex-1 sm:flex-none">
              <Download className="h-4 w-4 mr-1.5" />
              Export CSV
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="space-y-5 pt-1">
            {hasFilters && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs font-medium text-text-muted transition-colors hover:text-text-primary"
                >
                  Clear all
                </button>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-xs text-text-muted font-medium">Status</Label>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((option) => {
                  const selected = currentStatus === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateParam({ status: option.value })}
                      aria-pressed={selected}
                      className={cn(
                        "h-8 rounded-full px-3.5 text-xs font-medium transition-colors",
                        selected
                          ? "bg-accent-primary text-white"
                          : "border border-border text-text-muted hover:bg-bg-elevated hover:text-text-primary"
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-border" />

            <div className="space-y-3">
              <p className={sectionLabel}>Dates</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs text-text-muted font-medium">Expiry</Label>
                    <span className="text-xs font-medium text-text-primary tabular-nums">
                      {expiryLabel}
                    </span>
                  </div>
                  <div className="flex h-10 items-center px-1">
                    <Slider
                      min={0}
                      max={EXPIRY_MAX_MONTHS}
                      step={1}
                      minStepsBetweenThumbs={1}
                      value={expiryRange}
                      onValueChange={(v) => setExpiryRange([v[0], v[1]] as [number, number])}
                      onValueCommit={commitExpiry}
                      aria-label="Expiry range in months"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-text-muted font-medium">Acquired</Label>
                  <Select
                    value={currentCreated}
                    onValueChange={(value) =>
                      updateParam({ created: value === "all" ? "" : value })
                    }
                  >
                    <SelectTrigger className="h-10 rounded-lg">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="1m">This Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-text-muted font-medium">Renewal</Label>
                  <Select
                    value={currentRenewal}
                    onValueChange={(value) =>
                      updateParam({ renewal: value === "all" ? "" : value })
                    }
                  >
                    <SelectTrigger className="h-10 rounded-lg">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="decided">Not decided</SelectItem>
                      <SelectItem value="yes">Will renew</SelectItem>
                      <SelectItem value="no">Will not renew</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="border-t border-border" />

            <div className="space-y-3">
              <p className={sectionLabel}>Classification</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <div className="space-y-1">
                  <Label className="text-xs text-text-muted font-medium">TLD</Label>
                  <Select
                    value={currentTld}
                    onValueChange={(value) => updateParam({ tld: value === "all" ? "" : value })}
                  >
                    <SelectTrigger className="h-10 rounded-lg">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {tlds.map((tld) => (
                        <SelectItem key={tld} value={tld}>
                          .{tld}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-text-muted font-medium">Registrar</Label>
                  <Select
                    value={currentRegistrars}
                    onValueChange={(value) =>
                      updateParam({ registrar: value === "all" ? "" : value })
                    }
                  >
                    <SelectTrigger className="h-10 rounded-lg">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {registrars.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="border-t border-border" />

            <div className="space-y-2">
              <p className={sectionLabel}>Renewal history</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    updateParam({
                      renewed: currentRenewed === "yes" ? "" : "yes",
                    })
                  }
                  aria-pressed={currentRenewed === "yes"}
                  className={cn(
                    "h-8 rounded-full px-3.5 text-xs font-medium transition-colors",
                    currentRenewed === "yes"
                      ? "bg-accent-primary text-white"
                      : "border border-border text-text-muted hover:bg-bg-elevated hover:text-text-primary"
                  )}
                >
                  Renewed before
                </button>
              </div>
            </div>

            <div className="border-t border-border" />

            <div className="space-y-2">
              <p className={sectionLabel}>Marketplace</p>
              <Label className="text-xs font-medium text-text-muted">Not listed on</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "sedo", label: "Sedo" },
                  { value: "spaceship", label: "Spaceship" },
                  { value: "afternic", label: "Afternic" },
                ].map((platform) => {
                  const selected = notListedPlatforms.includes(platform.value);
                  return (
                    <button
                      key={platform.value}
                      type="button"
                      onClick={() => toggleNotListed(platform.value)}
                      aria-pressed={selected}
                      className={cn(
                        "h-8 rounded-full px-3.5 text-xs font-medium transition-colors",
                        selected
                          ? "bg-accent-primary text-white"
                          : "border border-border text-text-muted hover:bg-bg-elevated hover:text-text-primary"
                      )}
                    >
                      {platform.label}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-text-muted">Lander</Label>
                  <Select
                    value={currentLander || "all"}
                    onValueChange={(value) => updateParam({ lander: value === "all" ? "" : value })}
                  >
                    <SelectTrigger className="h-10 rounded-lg">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="buynow">Buy it Now</SelectItem>
                      <SelectItem value="price_form">Request Price</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                      <SelectItem value="no_method">Custom with no method</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-text-muted">Shows</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "buynow", label: "Buy Now" },
                      { value: "makeoffer", label: "Make Offer" },
                      { value: "lease", label: "Lease to Own" },
                    ].map((method) => {
                      const selected = showMethods.includes(method.value);
                      return (
                        <button
                          key={method.value}
                          type="button"
                          onClick={() => toggleShowMethod(method.value)}
                          aria-pressed={selected}
                          className={cn(
                            "h-8 rounded-full px-3.5 text-xs font-medium transition-colors",
                            selected
                              ? "bg-accent-primary text-white"
                              : "border border-border text-text-muted hover:bg-bg-elevated hover:text-text-primary"
                          )}
                        >
                          {method.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
