const MAX_DOMAINS = 200;
const MAX_HOSTNAME_LENGTH = 253;
const MAX_LABEL_LENGTH = 63;

const HOSTNAME_REGEX =
  /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.(?!-)[A-Za-z0-9-]{1,63}(?<!-))*\.[A-Za-z]{2,}$/;

const URL_PATTERN = /^https?:\/\/([^/:]+)/i;

function splitTokens(rawText: string): string[] {
  return rawText.split(/[\n\r,]+/).flatMap((part) =>
    part
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
  );
}

function stripUrl(token: string): string {
  const match = token.match(URL_PATTERN);
  if (match && match[1]) {
    return match[1].replace(/\/+$/, "");
  }

  const cleaned = token.replace(/\/+$/, "").replace(/:\d+$/, "");
  const slashIndex = cleaned.indexOf("/");
  if (slashIndex > 0 && !cleaned.startsWith("http")) {
    return cleaned.slice(0, slashIndex);
  }

  return cleaned;
}

function isValidHostname(hostname: string): boolean {
  if (hostname.length > MAX_HOSTNAME_LENGTH) {
    return false;
  }

  if (!HOSTNAME_REGEX.test(hostname)) {
    return false;
  }

  const labels = hostname.split(".");
  for (const label of labels) {
    if (label.length > MAX_LABEL_LENGTH) {
      return false;
    }
  }

  return true;
}

interface ParseResult {
  domains: string[];
}

interface ParseError {
  error: string;
}

export function parseDomainList(
  rawText: string
): ParseResult | ParseError {
  const tokens = splitTokens(rawText);

  const seen = new Set<string>();
  const domains: string[] = [];

  for (const token of tokens) {
    let cleaned = stripUrl(token);
    cleaned = cleaned.toLowerCase();

    if (isValidHostname(cleaned)) {
      if (!seen.has(cleaned)) {
        seen.add(cleaned);
        domains.push(cleaned);
        if (domains.length > MAX_DOMAINS) {
          return {
            error: `Input exceeds maximum of ${MAX_DOMAINS} domains (found: ${domains.length})`,
          };
        }
      }
    }
  }

  return { domains };
}
