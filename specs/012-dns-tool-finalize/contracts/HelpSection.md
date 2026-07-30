# Contract: HelpSection

**Module**: `components/dns-checker/HelpSection.tsx`
**Exported as**: `HelpSection`

## Signature

```typescript
function HelpSection(): JSX.Element
```

## Behavior

1. Renders a collapsible disclosure section (shadcn/ui `Collapsible` or native `<details>` element)
2. Default state: collapsed (closed) to minimize visual clutter for returning users
3. Trigger label: "How to use this tool" or "Help & FAQ" with a chevron icon

### Content Sections

**How it Works**:
1. Paste domain names in the text area (any format)
2. Choose your DNS resolver (Cloudflare or Google)
3. Click "Resolve" or press Ctrl+Enter (Cmd+Enter on Mac)
4. Results appear live — click IPs to copy, domains to visit

**Supported Formats**:
- Plain domains: `google.com`, `cloudflare.com`
- URLs: `https://example.com/page`
- Commas: `google.com, cloudflare.com, github.com`
- Newlines: one domain per line
- Mixed separators all work together

**FAQ**:
- **Why do results differ between resolvers?** DNS changes take time to propagate. Cloudflare and Google may have different cached results.
- **What does "No DNS" mean?** The domain either has no A (IPv4) record, or the DNS lookup timed out (after 5 seconds).
- **What's the limit?** You can resolve up to 200 domains at a time, with 20 running concurrently.
- **Is my data private?** Yes — all lookups happen directly from your browser to Cloudflare/Google. We never see your domain lists or results.

## States

| State | Visual |
|-------|--------|
| Collapsed (default) | "How to use this tool" with chevron-down icon |
| Expanded | Full help content visible |

## Placement

Rendered below the header/title and above the DomainInput in the page layout. Separated by a subtle divider or `space-y`.
