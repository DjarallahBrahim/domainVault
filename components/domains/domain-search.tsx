"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";

interface DomainSearchProps {
  tlds: string[];
}

export function DomainSearch({ tlds }: DomainSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get("search") ?? "";
  const currentStatus = searchParams.get("status") ?? "";
  const currentTld = searchParams.get("tld") ?? "";

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.set("page", "1");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <Input
          placeholder="Search domains..."
          value={currentSearch}
          onChange={(e) => {
            const val = e.target.value;
            const params = new URLSearchParams(searchParams.toString());
            if (val) {
              params.set("search", val);
            } else {
              params.delete("search");
            }
            params.set("page", "1");
            router.push(`${pathname}?${params.toString()}`);
          }}
          className="pl-9 pr-9"
        />
        {currentSearch && (
          <button
            onClick={() => updateParam("search", "")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <Select
        value={currentStatus}
        onValueChange={(value) => updateParam("status", value === "all" ? "" : value)}
      >
        <SelectTrigger className="w-full sm:w-[140px]">
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
        value={currentTld}
        onValueChange={(value) => updateParam("tld", value === "all" ? "" : value)}
      >
        <SelectTrigger className="w-full sm:w-[140px]">
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
    </div>
  );
}
