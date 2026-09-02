"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { usePromotingDomains } from "@/lib/hooks/usePromotingDomains";

interface DomainPickerProps {
  value: string | null;
  onChange: (domainId: string) => void;
}

export function DomainPicker({ value, onChange }: DomainPickerProps) {
  const { domains, isLoading } = usePromotingDomains();
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const selected = domains.find((d) => d.id === value);

  const filtered = search.trim()
    ? domains.filter((d) => d.domain.toLowerCase().includes(search.trim().toLowerCase()))
    : domains;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full md:w-72 justify-between font-mono"
        >
          {selected ? selected.domain : "Select a domain…"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72" align="start">
        <DropdownMenuLabel className="px-2 py-1.5">
          {isLoading ? (
            <Skeleton className="h-4 w-full" />
          ) : (
            <Input
              placeholder="Search domains…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8"
              autoFocus
            />
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <div className="space-y-1 p-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : domains.length === 0 ? (
          <DropdownMenuItem disabled className="text-sm text-text-muted">
            No domains yet — add one from Import.
          </DropdownMenuItem>
        ) : filtered.length === 0 ? (
          <DropdownMenuItem disabled className="text-sm text-text-muted">
            No domains found.
          </DropdownMenuItem>
        ) : (
          filtered.map((domain) => (
            <DropdownMenuItem
              key={domain.id}
              onSelect={() => {
                onChange(domain.id);
                setSearch("");
                setOpen(false);
              }}
              className="flex items-center justify-between gap-2 font-mono text-sm"
            >
              <span className="truncate">{domain.domain}</span>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center rounded-md border border-border px-1.5 py-0.5 text-[10px] font-semibold",
                  domain.reserved_tlds_count === null
                    ? "text-text-muted"
                    : domain.reserved_tlds_count > 0
                      ? "bg-accent-primary/10 text-accent-primary"
                      : "text-text-muted"
                )}
              >
                {domain.reserved_tlds_count === null
                  ? "not checked"
                  : `${domain.reserved_tlds_count} reserved`}
              </span>
              {domain.id === value && (
                <Check className="h-3.5 w-3.5 shrink-0 text-accent-success" />
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
