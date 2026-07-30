export interface TldProvider {
  name: string;
  endpoint: string;
  headers: Record<string, string>;
}

const provider: TldProvider = {
  name: "cloudflare",
  endpoint: "https://cloudflare-dns.com/dns-query?name={domain}&type=NS",
  headers: { Accept: "application/dns-json" },
};

export function getProvider(): TldProvider {
  return provider;
}
