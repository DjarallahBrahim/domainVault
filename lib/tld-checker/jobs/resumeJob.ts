import type { TldCheckJobRow } from "@/lib/supabase/queries/tld-jobs";

export function filterIncompleteDomains(
  job: TldCheckJobRow,
  domains: Array<{ id: string; tlds_last_checked_at: string | null }>
): string[] {
  const jobCreatedAt = new Date(job.created_at).getTime();

  return domains
    .filter((d) => {
      if (!d.tlds_last_checked_at) return true;
      const checkedAt = new Date(d.tlds_last_checked_at).getTime();
      return checkedAt < jobCreatedAt;
    })
    .map((d) => d.id);
}
