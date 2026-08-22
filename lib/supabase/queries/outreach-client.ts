import { createClient } from "@/lib/supabase/client";
import type { OutreachRow, ReplyStatus } from "@/types/promoting";

export interface OutreachUpsertInput {
  domainId: string;
  tld: string;
  fullDomain: string;
  contacted: boolean;
  contactedAt: string | null;
  replyStatus: ReplyStatus;
  replyAt: string | null;
}

export async function upsertOutreachRow(input: OutreachUpsertInput): Promise<void> {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not authenticated");

  const { error } = await supabase.from("tld_outreach").upsert(
    {
      user_id: user.id,
      domain_id: input.domainId,
      tld: input.tld,
      full_domain: input.fullDomain,
      contacted: input.contacted,
      contacted_at: input.contactedAt,
      reply_status: input.replyStatus,
      reply_at: input.replyAt,
    } as never,
    { onConflict: "domain_id,tld" }
  );

  if (error) throw error;
}

export async function fetchOutreachRows(domainId: string): Promise<
  Array<
    {
      tld: string;
      full_domain: string;
    } & OutreachRow
  >
> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("tld_outreach")
    .select("tld, full_domain, contacted, contacted_at, reply_status, reply_at")
    .eq("domain_id", domainId);

  if (error) throw error;

  return (data ?? []) as unknown as Array<
    {
      tld: string;
      full_domain: string;
    } & OutreachRow
  >;
}
