import type { Resolver } from "./types";

export interface ResolverConfig {
  name: Resolver;
  endpoint: string;
  headers: Record<string, string>;
}

const providers: Record<Resolver, ResolverConfig> = {
  cloudflare: {
    name: "cloudflare",
    endpoint: "https://cloudflare-dns.com/dns-query?name={domain}&type=A",
    headers: { Accept: "application/dns-json" },
  },
  google: {
    name: "google",
    endpoint: "https://dns.google/resolve?name={domain}&type=A",
    headers: {},
  },
};

export function getProvider(provider: Resolver): ResolverConfig {
  return providers[provider];
}
