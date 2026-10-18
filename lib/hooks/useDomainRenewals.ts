"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { fetchDomainRenewals } from "@/lib/supabase/queries/renewals-client";

export function useDomainRenewals(domainId: string | null) {
  return useQuery({
    queryKey: queryKeys.domains.renewals(domainId ?? "none"),
    queryFn: () => fetchDomainRenewals(domainId as string),
    enabled: !!domainId,
    staleTime: 15 * 1000,
  });
}
