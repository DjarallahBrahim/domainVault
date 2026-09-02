export interface PromotingDomainOption {
  id: string;
  domain: string;
  reserved_tlds_count: number | null;
  tlds_last_checked_at: string | null;
}

export interface ReservedTld {
  tld: string;
  fullDomain: string;
  isLive: boolean;
}

export type ReplyStatus = "pending" | "positive" | "negative";

export interface OutreachRow {
  contacted: boolean;
  contacted_at: string | null;
  reply_status: ReplyStatus;
  reply_at: string | null;
}
