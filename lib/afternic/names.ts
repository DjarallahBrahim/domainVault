/**
 * Domain-name normalisation for Afternic.
 * The API requires lower-case ASCII (IDNA2008 / punycode) names.
 */

const DOMAIN_RE = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/;

/**
 * Converts a human-entered domain (possibly mixed case, with protocol/path,
 * or an IDN like `exämple.de`) into the ASCII form Afternic expects.
 * Uses the WHATWG URL parser, which performs IDNA/punycode conversion.
 */
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
