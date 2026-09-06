export interface WhoisAnalysis {
  domain: string;
  registered: boolean;
  expirationDate: string | null;
  registrar: {
    value: string | null;
    raw: string | null;
    allowed: boolean;
  };
}

export async function analyzeDomain(domain: string): Promise<WhoisAnalysis> {
  const res = await fetch(`/api/whois?domain=${encodeURIComponent(domain)}`, {
    cache: "no-store",
  });
  const body = (await res.json()) as {
    data?: WhoisAnalysis;
    error?: string;
  };
  if (!res.ok || !body.data) {
    throw new Error(body.error || "WHOIS lookup failed");
  }
  return body.data;
}
