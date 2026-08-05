"use client";

import { useState, useCallback } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Search, X, Download, RotateCcw } from "lucide-react";

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
  const currentStatus = searchParams.get("status") ?? "";
  const currentTld = searchParams.get("tld") ?? "";
  const currentExpiry = searchParams.get("expiry") ?? "";
  const currentRegistrars = searchParams.get("registrar") ?? "";
  const currentRenewal = searchParams.get("renewal") ?? "";
  const currentPageSize = searchParams.get("pageSize") ?? "50";

  const [searchValue, setSearchValue] = useState(urlSearch.replace(/,/g, " "));
  const [showAdvanced, setShowAdvanced] = useState(false);

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
    router.push(pathname);
  }

  const hasFilters =
    urlSearch || currentStatus || currentTld || currentExpiry || currentRegistrars || currentRenewal;
  const activeFilterCount = [currentStatus, currentTld, currentExpiry, currentRegistrars, currentRenewal].filter(
    Boolean
  ).length;

  const filterGridCols = showAdvanced
    ? "grid-cols-1 sm:grid-cols-3 lg:grid-cols-6"
    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";

  return (
    <Card className="max-w-7xl mx-auto rounded-xl border shadow-sm">
      <CardContent className="p-4 md:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 lg:max-w-2xl">
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
            <Button variant="outline" onClick={onExport} className="h-11 flex-1 sm:flex-none">
              <Download className="h-4 w-4 mr-1.5" />
              Export CSV
            </Button>
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs text-text-muted cursor-pointer select-none">
          <Checkbox
            checked={showAdvanced}
            onCheckedChange={(c) => setShowAdvanced(!!c)}
          />
          Show advanced filters
        </label>

        <div className={`grid ${filterGridCols} gap-3 items-end`}>
          {showAdvanced && (
            <div className="space-y-1">
              <Label className="text-xs text-text-muted font-medium">Status</Label>
              <Select
                value={currentStatus}
                onValueChange={(value) => updateParam({ status: value === "all" ? "" : value })}
              >
                <SelectTrigger className="h-10 rounded-lg">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-xs text-text-muted font-medium">Expiry</Label>
            <Select
              value={currentExpiry}
              onValueChange={(value) => updateParam({ expiry: value === "all" ? "" : value })}
            >
              <SelectTrigger className="h-10 rounded-lg">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="1m">≤1 month</SelectItem>
                <SelectItem value="3m">≤3 months</SelectItem>
                <SelectItem value="6m">≤6 months</SelectItem>
                <SelectItem value="9m">≤9 months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {showAdvanced && (
            <div className="space-y-1">
              <Label className="text-xs text-text-muted font-medium">Renewal</Label>
              <Select
                value={currentRenewal}
                onValueChange={(value) => updateParam({ renewal: value === "all" ? "" : value })}
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
          )}

          {showAdvanced && (
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
          )}

          <div className="space-y-1">
            <Label className="text-xs text-text-muted font-medium">Registrar</Label>
            <Select
              value={currentRegistrars}
              onValueChange={(value) => updateParam({ registrar: value === "all" ? "" : value })}
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

          {/* Existing filter grid continues */}
          <div className="space-y-1">
            <Label className="text-xs text-text-muted font-medium">Page Size</Label>
            <Select
              value={currentPageSize}
              onValueChange={(value) => updateParam({ pageSize: value })}
            >
              <SelectTrigger className="h-10 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasFilters ? (
            <div className="space-y-1">
              <Label className="text-xs text-text-muted font-medium invisible">Actions</Label>
              <Button
                variant="ghost"
                size="default"
                onClick={clearAll}
                className="h-10 rounded-lg text-text-muted hover:text-text-primary w-full justify-start"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Reset Filters
                <span className="ml-1 text-xs opacity-60">
                  ({activeFilterCount} active)
                </span>
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              <Label className="text-xs text-text-muted font-medium invisible">Actions</Label>
              <span className="inline-flex items-center h-10 text-xs text-text-muted">
                <RotateCcw className="h-3.5 w-3.5 mr-1.5 opacity-40" />
                No filters
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
