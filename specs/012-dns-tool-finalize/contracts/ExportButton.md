# Contract: ExportButton

**Module**: `components/dns-checker/ExportButton.tsx`
**Exported as**: `ExportButton`

## Signature

```typescript
function ExportButton(props: {
  results: DnsResult[] | ComparisonResult[];
  compareMode: boolean;
  disabled: boolean;
}): JSX.Element
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `results` | `DnsResult[] \| ComparisonResult[]` | Current resolution results (non-null) |
| `compareMode` | `boolean` | Whether in Compare Providers mode (changes CSV columns) |
| `disabled` | `boolean` | Disable the button (e.g. no results, loading) |

## Behavior

1. Renders a "Copy CSV" button (shadcn/ui `Button` with `Copy` icon from lucide-react)
2. On click: builds a CSV string from results
   - Single mode: columns `domain,status,ip`
   - Compare mode: columns `domain,cloudflare_status,cloudflare_ips,google_status,google_ips`
3. CSV escaping per RFC 4180: fields containing commas or quotes are wrapped in double quotes; internal quotes doubled
4. Multiple IPs per domain are comma-separated within the IP cell
5. Attempts `navigator.clipboard.writeText(csv)`
   - Success: brief "Copied!" visual feedback (tooltip or temporary badge)
   - Failure (clipboard unavailable): fall back to Blob download
6. Blob download: create `new Blob([csv], { type: "text/csv" })`, generate object URL, create temporary `<a download="dns-results.csv">`, click it, revoke URL
7. Disabled state: button greyed out when no results exist or resolution is in progress

## CSV Format Examples

### Single Mode
```csv
domain,status,ip
google.com,ok,142.250.80.78
cloudflare.com,ok,"104.16.133.229,104.16.132.229"
notreal.xyz,no_dns,
```

### Compare Mode
```csv
domain,cloudflare_status,cloudflare_ips,google_status,google_ips
google.com,ok,142.250.80.78,ok,142.250.80.78
example.com,ok,93.184.216.34,ok,93.184.216.34
```
