import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { ReservedTld } from "@/types/promoting";

async function fetchReservedTlds(domainId: string): Promise<ReservedTld[]> {
  const response = await fetch(`/api/tld-checker/domains/${domainId}/extensions`);

  if (!response.ok) {
    throw new Error("Failed to load reserved TLDs");
  }

  const json = (await response.json()) as { data?: ReservedTld[] };
  return json.data ?? [];
}

export function useReservedTlds(domainId: string | null, neverCheckedHint: boolean) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: queryKeys.promoting.reservedTlds(domainId),
    queryFn: () => fetchReservedTlds(domainId as string),
    enabled: !!domainId && !neverCheckedHint,
    staleTime: 30 * 1000,
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[2] === domainId ? previousData : undefined,
  });

  const tlds = data ?? [];

  return {
    tlds,
    isLoading,
    isEmpty: !neverCheckedHint && tlds.length === 0 && !isLoading,
    neverChecked: neverCheckedHint,
    refetch,
  };
}
