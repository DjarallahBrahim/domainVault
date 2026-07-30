"use client";

import { DomainExpiryBadge } from "@/components/domains/domain-expiry-badge";
import { SedoCardRow } from "@/components/domains/SedoCardRow";
import { SpaceshipCell } from "@/components/domains/SpaceshipCell";
import { TldCell } from "@/components/domains/TldCell";
import type { Database } from "@/types/supabase";
import type { SedoListing } from "@/types/sedo";
import type { SpaceshipListing } from "@/types/spaceship";
import { useRouter } from "next/navigation";

type DomainRow = Database["public"]["Tables"]["domains"]["Row"];

interface DomainCardProps {
  domain: DomainRow;
  onDelete: (id: string) => void;
  sedoListings: Map<string, SedoListing>;
  onSedoEdit: (domain: DomainRow, listing: SedoListing) => void;
  onSedoCreate: (domain: DomainRow) => void;
  onSedoRefresh: (domain: DomainRow) => void;
  sedoRefreshingIds: Set<string>;
  spaceshipListings: Map<string, SpaceshipListing>;
  onSpaceshipEdit: (domain: DomainRow, listing: SpaceshipListing) => void;
  onSpaceshipCreate: (domain: DomainRow) => void;
  onSpaceshipRefresh: (domain: DomainRow) => void;
  spaceshipRefreshingIds: Set<string>;
  reservedExtensions: Map<string, string[]>;
}

const formatPrice = (price: number | null): string => {
  if (price === null || price === undefined) return "—";
  return `$${price.toLocaleString()}`;
};

export function DomainCard({ domain, onDelete, sedoListings, onSedoEdit, onSedoCreate, onSedoRefresh, sedoRefreshingIds, spaceshipListings, onSpaceshipEdit, onSpaceshipCreate, onSpaceshipRefresh, spaceshipRefreshingIds, reservedExtensions }: DomainCardProps) {
  const router = useRouter();

  return (
    <div className="rounded-lg border border-border bg-bg-surface p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/domains/${domain.id}`)}
            className="font-mono font-medium text-accent-primary hover:underline text-left"
          >
            {domain.domain}
          </button>
          <TldCell
            domainId={domain.id}
            domainName={domain.domain}
            reservedTldsCount={
              (domain as Record<string, unknown>).reserved_tlds_count as number | null ?? null
            }
            reservedExtensions={reservedExtensions.get(domain.id) ?? []}
          />
        </div>
      </div>

      <div className="text-xs text-text-muted space-y-1">
        {domain.registrar && (
          <div className="flex justify-between">
            <span>Registrar</span>
            <span>{domain.registrar}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Expires</span>
          <span className="flex items-center gap-1">
            {new Date(domain.expiration_date).toLocaleDateString()}
            <DomainExpiryBadge expirationDate={domain.expiration_date} />
          </span>
        </div>
        <div className="flex justify-between">
          <span>BIN</span>
          <span>{formatPrice((domain as Record<string, unknown>).bin as number | null)}</span>
        </div>
        <div className="border-t border-border pt-2">
          <SedoCardRow
            listing={sedoListings.get(domain.id)}
            onEdit={(listing) => onSedoEdit(domain, listing)}
            onCreate={() => onSedoCreate(domain)}
            onRefresh={() => onSedoRefresh(domain)}
            refreshing={sedoRefreshingIds.has(domain.id)}
          />
        </div>
        <div className="border-t border-border pt-2">
          <div className="flex justify-between text-xs">
            <span className="text-text-muted">Spaceship</span>
            <SpaceshipCell
              listing={spaceshipListings.get(domain.id)}
              onEdit={(listing) => onSpaceshipEdit(domain, listing)}
              onCreate={() => onSpaceshipCreate(domain)}
              onRefresh={() => onSpaceshipRefresh(domain)}
              refreshing={spaceshipRefreshingIds.has(domain.id)}
            />
          </div>
        </div>
        <div className="flex justify-between">
          <span>Added</span>
          <span>{new Date(domain.created_at).toLocaleDateString()}</span>
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
