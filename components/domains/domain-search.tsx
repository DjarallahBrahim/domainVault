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
  const currentPageSize = searchParams.get("pageSize") ?? "50";

  const [searchValue, setSearchValue] = useState(urlSearch);

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
    const val = searchValue.trim();
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
    urlSearch || currentStatus || currentTld || currentExpiry || currentRegistrars;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 w-full">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            placeholder="Search domains (comma-separate multiple)"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") triggerSearch();
            }}
            className="pl-9 pr-9"
          />
          {searchValue && (
            <button
              onClick={() => {
                setSearchValue("");
                updateParam({ search: "" });
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={triggerSearch}
          title="Search"
          className="shrink-0"
        >
          <Search className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={onExport}
          title="Export CSV"
          className="shrink-0"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
        <Select
          value={currentStatus}
          onValueChange={(value) => updateParam({ status: value === "all" ? "" : value })}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={currentExpiry}
          onValueChange={(value) => updateParam({ expiry: value === "all" ? "" : value })}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Expiry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Expiry</SelectItem>
            <SelectItem value="1m">≤1 month</SelectItem>
            <SelectItem value="3m">≤3 months</SelectItem>
            <SelectItem value="6m">≤6 months</SelectItem>
            <SelectItem value="9m">≤9 months</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={currentTld}
          onValueChange={(value) => updateParam({ tld: value === "all" ? "" : value })}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="TLD" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All TLDs</SelectItem>
            {tlds.map((tld) => (
              <SelectItem key={tld} value={tld}>
                .{tld}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={currentRegistrars}
          onValueChange={(value) => updateParam({ registrar: value === "all" ? "" : value })}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Registrar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Registrars</SelectItem>
            {registrars.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={currentPageSize}
          onValueChange={(value) => updateParam({ pageSize: value })}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-8 text-xs text-text-muted col-span-2 sm:col-span-1"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Clear all
          </Button>
        )}
      </div>
    </div>
  );
}
