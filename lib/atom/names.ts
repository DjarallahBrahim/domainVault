/**
 * Domain-name normalisation for Atom.com.
 * Atom accepts normal domain names; IDNs are converted to punycode so cache
 * matching and API lookups stay consistent with the rest of the app.
 */

const DOMAIN_RE = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/;

export function toAsciiDomain(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;

  try {
    const url = new URL(withScheme);
    return url.hostname.toLowerCase().replace(/\.$/, "");
  } catch {
    return trimmed.toLowerCase().replace(/\.$/, "");
  }
}

export function isValidAsciiDomain(domain: string): boolean {
  return DOMAIN_RE.test(toAsciiDomain(domain));
}
