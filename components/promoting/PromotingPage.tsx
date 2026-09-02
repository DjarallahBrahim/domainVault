"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";
import { queryKeys } from "@/lib/query-keys";
import { usePromotingDomains } from "@/lib/hooks/usePromotingDomains";
import { useReservedTlds } from "@/lib/hooks/useReservedTlds";
import { useTldOutreach } from "@/lib/hooks/useTldOutreach";
import { DomainPicker } from "./DomainPicker";
import { PromotingSummaryCards } from "./PromotingSummaryCards";
import { ReservedTldTable } from "./ReservedTldTable";
import { ReservedTldCardRow } from "./ReservedTldCardRow";
import { RunTldCheckPrompt } from "./RunTldCheckPrompt";

interface PromotingPageProps {
  initialDomainId: string | null;
}

export function PromotingPage({ initialDomainId }: PromotingPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedDomainId, setSelectedDomainId] = React.useState<string | null>(initialDomainId);

  const { domains } = usePromotingDomains();
  const selected = selectedDomainId
    ? (domains.find((d) => d.id === selectedDomainId) ?? null)
    : null;

  const neverChecked = selected ? selected.reserved_tlds_count === null : false;

  const { tlds, isLoading: tldsLoading, isEmpty } = useReservedTlds(selectedDomainId, neverChecked);

  const fullDomainByTld = React.useMemo(
    () => new Map(tlds.map((t) => [t.tld, t.fullDomain])),
    [tlds]
  );

  const {
    outreach,
    isLoading: outreachLoading,
    toggleContacted,
    setReplyStatus,
  } = useTldOutreach(selectedDomainId, fullDomainByTld);

  const tableLoading = tldsLoading || outreachLoading;

  const handleSelect = (domainId: string) => {
    setSelectedDomainId(domainId);
    router.replace(`/promoting?domain=${domainId}`, { scroll: false });
  };

  const handleRunSuccess = async () => {
    if (!selectedDomainId) return;
    await queryClient.invalidateQueries({
      queryKey: queryKeys.promoting.reservedTlds(selectedDomainId),
    });
    await queryClient.invalidateQueries({
      queryKey: queryKeys.promoting.domains(),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary">Promoting</h1>
          <p className="text-sm text-text-muted">
            Track outreach to owners of reserved TLD variants of your domains.
          </p>
        </div>
        <DomainPicker value={selectedDomainId} onChange={handleSelect} />
      </div>

      {!selectedDomainId && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-bg-surface px-6 py-16 text-center">
          <Megaphone className="h-10 w-10 text-text-muted" />
          <p className="text-lg font-medium text-text-primary">
            Select a domain to start tracking outreach
          </p>
          <p className="max-w-md text-sm text-text-muted">
            Pick a domain above to see every reserved TLD variant and log your contact with the
            current owners.
          </p>
        </div>
      )}

      {selectedDomainId && selected && (
        <>
          <PromotingSummaryCards tlds={tlds} outreach={outreach} isLoading={tableLoading} />

          {neverChecked || isEmpty ? (
            <RunTldCheckPrompt
              domainId={selectedDomainId}
              domainName={selected.domain}
              variant={neverChecked ? "neverChecked" : "isEmpty"}
              tldsChecked={selected.reserved_tlds_count ?? undefined}
              onSuccess={handleRunSuccess}
            />
          ) : (
            <>
              <div className="hidden md:block">
                <ReservedTldTable
                  tlds={tlds}
                  outreach={outreach}
                  isLoading={tableLoading}
                  onToggleContacted={toggleContacted}
                  onSetReply={setReplyStatus}
                />
              </div>
              <div className="md:hidden">
                <ReservedTldCardRow
                  tlds={tlds}
                  outreach={outreach}
                  isLoading={tableLoading}
                  onToggleContacted={toggleContacted}
                  onSetReply={setReplyStatus}
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
