export type TldCheckStatus =
  | "available"
  | "registered"
  | "reserved"
  | "error";

export interface TldCheckResult {
  word: string;
  tld: string;
  domain: string;
  status: TldCheckStatus;
  error?: string;
  tookMs?: number;
}

export interface DoHNSResponse {
  Status: number;
  TC: boolean;
  RD: boolean;
  RA: boolean;
  AD: boolean;
  CD: boolean;
  Question: Array<{
    name: string;
    type: number;
  }>;
  Answer?: Array<{
    name: string;
    type: number;
    TTL: number;
    data: string;
  }>;
}
