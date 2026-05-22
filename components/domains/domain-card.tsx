"use client";

import { DomainStatusBadge } from "@/components/domains/domain-status-badge";
import { DomainExpiryBadge } from "@/components/domains/domain-expiry-badge";
import type { Database } from "@/types/supabase";
import { useRouter } from "next/navigation";

type DomainRow = Database["public"]["Tables"]["domains"]["Row"];

interface DomainCardProps {
  domain: DomainRow;
  onDelete: (id: string) => void;
}

const formatPrice = (price: number | null): string => {
  if (price === null || price === undefined) return "—";
  return `$${price.toLocaleString()}`;
};

export function DomainCard({ domain, onDelete }: DomainCardProps) {
  const router = useRouter();

  return (
    <div className="rounded-lg border border-border bg-bg-surface p-4 space-y-2">
      <div className="flex items-start justify-between">
        <button
          onClick={() => router.push(`/domains/${domain.id}`)}
          className="font-mono font-medium text-accent-primary hover:underline text-left"
        >
          {domain.domain}
        </button>
        <DomainStatusBadge status={domain.status} />
      </div>
      <div className="text-xs text-text-muted space-y-1">
        <div className="flex justify-between">
          <span>TLD</span>
          <span>.{domain.tld}</span>
        </div>
        <div className="flex justify-between">
          <span>Expires</span>
          <span className="flex items-center gap-1">
            {new Date(domain.expiration_date).toLocaleDateString()}
            <DomainExpiryBadge expirationDate={domain.expiration_date} />
          </span>
        </div>
        <div className="flex justify-between">
          <span>Price</span>
          <span>{formatPrice(domain.purchase_price)}</span>
        </div>
      </div>
      <div className="flex gap-2 pt-2 border-t border-border">
        <button
          onClick={() => router.push(`/domains/${domain.id}`)}
          className="flex-1 py-1.5 text-xs font-medium text-accent-primary bg-accent-primary/10 rounded-md hover:bg-accent-primary/20"
        >
          View
        </button>
        <button
          onClick={() => onDelete(domain.id)}
          className="flex-1 py-1.5 text-xs font-medium text-accent-danger bg-accent-danger/10 rounded-md hover:bg-accent-danger/20"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
