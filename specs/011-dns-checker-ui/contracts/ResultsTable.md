# Contract: ResultsTable

**Module**: `components/dns-checker/ResultsTable.tsx`
**Exported as**: `ResultsTable`

## Signature

```typescript
function ResultsTable(props: {
  results: (DnsResult | null)[];
  filter: "all" | "dns_ok" | "no_dns";
}): JSX.Element
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `results` | `(DnsResult \| null)[]` | Resolution results. `null` entries = not yet resolved (shown as skeleton/loading row) |
| `filter` | `"all" \| "dns_ok" \| "no_dns"` | Which status to show. Filtering is done by the consumer (hook passes `filteredResults`) |

## Columns

| Column | Content |
|--------|---------|
| **Status** | Icon/badge: green checkmark for `"ok"`, grey X for `"no_dns"` |
| **Domain** | Clickable link: `<a href="https://{domain}" target="_blank" rel="noopener noreferrer">`. Opens in new tab. |
| **IPs** | Chip(s) per IP. Click copies to clipboard via `navigator.clipboard.writeText(ip)`. Visual confirmation on copy (tooltip or brief highlight). Multiple IPs wrap in flex container. |
| **Resolver** | Text: "Cloudflare" or "Google" |
| **Latency** | `{tookMs}ms` formatted. Not shown for pending/null rows. |
| **Error** | Shown inline below IPs when `status === "no_dns" && error` exists. Styled as muted text. |

## Row States

| State | Visual |
|-------|--------|
| Pending (null) | Skeleton shimmer row (placeholder) |
| DNS OK | Green status icon, domain link, IP chips, latency |
| No DNS (no error) | Grey status icon, domain link, no IPs, "No A records" |
| No DNS (with error) | Grey status icon, domain link, error message in muted text |

## Mobile

- `< 768px`: Table switches to horizontal-scroll container (matching constitution domain table pattern)
- IP chips wrap to prevent overflow

## Empty States

| Condition | Message |
|-----------|---------|
| No results ever started | "Enter domains above and click Resolve to see results" |
| Filter returns zero rows | "No matching results" with a suggestion to change filter |

## Example

```tsx
<ResultsTable
  results={filteredResults}
  filter={filter}
/>
```
