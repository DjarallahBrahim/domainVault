import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { upsertOutreachRow, fetchOutreachRows } from "@/lib/supabase/queries/outreach-client";
import type { OutreachRow, ReplyStatus } from "@/types/promoting";

const DEFAULT_ROW: OutreachRow = {
  contacted: false,
  contacted_at: null,
  reply_status: "negative",
  reply_at: null,
};

async function loadOutreach(domainId: string): Promise<Map<string, OutreachRow>> {
  const rows = await fetchOutreachRows(domainId);
  const map = new Map<string, OutreachRow>();
  for (const row of rows) {
    map.set(row.tld, {
      contacted: row.contacted,
      contacted_at: row.contacted_at,
      reply_status: row.reply_status,
      reply_at: row.reply_at,
    });
  }
  return map;
}

export function useTldOutreach(domainId: string | null, fullDomainByTld: Map<string, string>) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.promoting.outreach(domainId),
    queryFn: () => loadOutreach(domainId as string),
    enabled: !!domainId,
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[2] === domainId ? previousData : undefined,
  });

  const outreach = data ?? new Map<string, OutreachRow>();

  const applyOptimistic = useCallback(
    (tld: string, next: OutreachRow): OutreachRow | null => {
      if (!domainId) return null;

      const previous = outreach.get(tld) ?? DEFAULT_ROW;
      queryClient.setQueryData<Map<string, OutreachRow>>(
        queryKeys.promoting.outreach(domainId),
        (old) => {
          const nextMap = new Map(old ?? []);
          nextMap.set(tld, next);
          return nextMap;
        }
      );
      return previous;
    },
    [domainId, outreach, queryClient]
  );

  const rollback = useCallback(
    (tld: string, previous: OutreachRow | null) => {
      if (!domainId || !previous) return;
      queryClient.setQueryData<Map<string, OutreachRow>>(
        queryKeys.promoting.outreach(domainId),
        (old) => {
          const nextMap = new Map(old ?? []);
          nextMap.set(tld, previous);
          return nextMap;
        }
      );
    },
    [domainId, queryClient]
  );

  const invalidate = useCallback(async () => {
    if (!domainId) return;
    await queryClient.invalidateQueries({
      queryKey: queryKeys.promoting.outreach(domainId),
    });
    await queryClient.invalidateQueries({
      queryKey: queryKeys.promoting.domains(),
    });
  }, [domainId, queryClient]);

  const toggleContacted = useCallback(
    async (tld: string, next: boolean) => {
      if (!domainId) return;

      const current = outreach.get(tld) ?? DEFAULT_ROW;
      const optimistic: OutreachRow = {
        contacted: next,
        contacted_at: next ? new Date().toISOString() : null,
        reply_status: current.reply_status,
        reply_at: current.reply_at,
      };

      const previous = applyOptimistic(tld, optimistic);
      try {
        await upsertOutreachRow({
          domainId,
          tld,
          fullDomain: fullDomainByTld.get(tld) ?? `${tld}`,
          contacted: optimistic.contacted,
          contactedAt: optimistic.contacted_at,
          replyStatus: optimistic.reply_status,
          replyAt: optimistic.reply_at,
        });
        await invalidate();
      } catch {
        rollback(tld, previous);
        toast.error("Could not update contact status. Try again.");
      }
    },
    [domainId, outreach, fullDomainByTld, applyOptimistic, rollback, invalidate]
  );

  const setReplyStatus = useCallback(
    async (tld: string, status: ReplyStatus) => {
      if (!domainId) return;

      const current = outreach.get(tld) ?? DEFAULT_ROW;
      const replyAt =
        status !== "pending" && current.reply_status === "pending"
          ? new Date().toISOString()
          : current.reply_at;

      const optimistic: OutreachRow = {
        contacted: current.contacted,
        contacted_at: current.contacted_at,
        reply_status: status,
        reply_at: replyAt,
      };

      const previous = applyOptimistic(tld, optimistic);
      try {
        await upsertOutreachRow({
          domainId,
          tld,
          fullDomain: fullDomainByTld.get(tld) ?? `${tld}`,
          contacted: optimistic.contacted,
          contactedAt: optimistic.contacted_at,
          replyStatus: optimistic.reply_status,
          replyAt: optimistic.reply_at,
        });
        await invalidate();
      } catch {
        rollback(tld, previous);
        toast.error("Could not update reply status. Try again.");
      }
    },
    [domainId, outreach, fullDomainByTld, applyOptimistic, rollback, invalidate]
  );

  return {
    outreach,
    isLoading,
    toggleContacted,
    setReplyStatus,
  };
}
