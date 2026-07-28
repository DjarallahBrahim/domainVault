# Contract: parseDomainList

**Module**: `lib/dns/parseInput.ts`
**Exported as**: `parseDomainList`

## Signature

```typescript
function parseDomainList(rawText: string): { domains: string[] } | { error: string }
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `rawText` | `string` | Yes | Raw text containing domains in any format. May be empty. |

## Return Value

A discriminated result:

```typescript
// Success: clean domain list extracted
{ domains: string[] }

// Failure: input exceeds cap or is otherwise invalid at a high level
{ error: string }
```

## Behavior

### Parsing Rules (in order)

1. **Split**: Split input on newlines, commas, and whitespace into tokens
2. **Strip**: Remove protocol (`https://`, `http://`), paths, ports, query strings, and trailing slashes from any token that looks like a URL
3. **Normalize**: Lowercase all tokens
4. **Validate**: Apply basic hostname regex (RFC 952/1123: 1-253 chars total, labels 1-63 chars, alphanumeric + hyphens, no leading/trailing hyphens)
5. **Deduplicate**: Remove duplicate domains (first occurrence kept)
6. **Trim**: Discard empty strings and invalid tokens

### Cap Enforcement

- If the resulting list exceeds 200 domains, return `{ error: "Input exceeds maximum of 200 domains (found: {count})" }`
- The 200 cap applies after deduplication
- Empty/whitespace-only input returns `{ domains: [] }` (no error)

### Validation Regex

```
/^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\\.(?!-)[A-Za-z0-9-]{1,63}(?<!-))*\\.[A-Za-z]{2,}$/
```

Maximum total length: 253 characters (checked separately from the regex).

## Examples

### Basic domains
```
Input:  "google.com, cloudflare.com"
Output: { domains: ["google.com", "cloudflare.com"] }
```

### URLs stripped
```
Input:  "https://example.com/path?q=1"
Output: { domains: ["example.com"] }
```

### Mixed separators
```
Input:  "google.com
        cloudflare.com, example.com github.com"
Output: { domains: ["google.com", "cloudflare.com", "example.com", "github.com"] }
```

### Duplicates removed
```
Input:  "google.com Google.COM google.com"
Output: { domains: ["google.com"] }
```

### Invalid discarded
```
Input:  "google.com, not a domain, !!!invalid, example.com"
Output: { domains: ["google.com", "example.com"] }
```

### Cap exceeded
```
Input:  [text containing 250 unique valid domains]
Output: { error: "Input exceeds maximum of 200 domains (found: 250)" }
```

### Empty input
```
Input:  "   "
Output: { domains: [] }
```

## Errors

No throwing. Invalid domains are silently discarded. The only error condition is exceeding the 200-domain cap.
