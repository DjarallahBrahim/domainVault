import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-keys";
import type { PromotingDomainOption } from "@/types/promoting";

async function fetchPromotingDomains(): Promise<PromotingDomainOption[]> {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("domains")
    .select("id, domain, reserved_tlds_count, tlds_last_checked_at")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("domain");

  if (error) throw error;

  return (data ?? []) as unknown as PromotingDomainOption[];
}

export function usePromotingDomains() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.promoting.domains(),
    queryFn: fetchPromotingDomains,
    staleTime: 5 * 60 * 1000,
  });

  return {
    domains: data ?? [],
    isLoading,
  };
}
