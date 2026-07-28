export type Resolver = "cloudflare" | "google";

export type DnsStatus = "ok" | "no_dns";

export interface DnsResult {
  domain: string;
  resolver: Resolver;
  status: DnsStatus;
  ips: string[];
  error?: string;
  tookMs?: number;
}

export interface DohResponse {
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
