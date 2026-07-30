# Developer Quickstart: TLD Reservation Checker

**Date**: 2026-07-30 | **Branch**: `013-tld-reservation-checker`

## Overview

The TLD Reservation Checker is a client-side tool that checks domain availability across TLDs using DNS NS record queries via Cloudflare DoH. It mirrors the DNS Checker's architecture exactly.

## Prerequisites

- Node.js 18+
- Project dependencies installed (`npm install`)
- Prior phases complete (specifically the DNS Checker in Phases 7-13 for reference)

## Quick Architecture Tour

```
lib/tld/                  ← Engine (pure functions, no React)
  types.ts                ← TldCheckStatus, TldCheckResult
  providers.ts            ← DoH endpoints for NS queries
  resolve.ts              ← checkAvailability(), checkAvailabilityBatch()
  parseInput.ts           ← parseBaseWords() — sanitize, dedup, validate

lib/hooks/
  useTldChecker.ts        ← State management (all UI state + engine calls)

components/tld-checker/   ← UI components
  DomainInput.tsx         ← Textarea for base words
  TldPicker.tsx           ← TLD chip selector
  ResultsTable.tsx        ← Results table with status columns
  StatCards.tsx           ← Summary stat cards (Phase 15)
  FilterPills.tsx         ← Status filter pills (Phase 15)
  ExportButton.tsx        ← Copy CSV button (Phase 15)
  HelpSection.tsx         ← Collapsible help (Phase 15)

app/(dashboard)/tld-checker/
  page.tsx               ← Page component (assembles all pieces)
```

## How the NS Check Works

1. User enters base words (e.g., `mybrand, acmecorp`) → parsed into `["mybrand", "acmecorp"]`
2. User selects TLDs (e.g., `.com`, `.io`) → `["com", "io"]`
3. Combinations built: `["mybrand.com", "mybrand.io", "acmecorp.com", "acmecorp.io"]`
4. Each domain queried via: `GET https://cloudflare-dns.com/dns-query?name={domain}&type=NS`
5. Response interpreted:
   - `Status: 0` + NS records → **Registered**
   - `Status: 3` (NXDOMAIN) → **Available**
   - Anything else → **Error**

## Key Differences from DNS Checker

| Aspect | DNS Checker | TLD Checker |
|--------|-------------|-------------|
| Input | Full domains | Base words + TLDs |
| Query | A records (type=1) | NS records (type=2) |
| Results | IP addresses | Availability status |
| Provider selection | Cloudflare / Google toggle | Cloudflare only |
| Compare mode | Yes | No |

## Development Workflow

```bash
# Type checking (run after any code change)
npx tsc --noEmit

# Run dev server
npm run dev

# Navigate to
# http://localhost:3000/tld-checker
```

## Testing Checklist

- [ ] Enter 1 base word with default TLDs, click Check → results appear with correct statuses
- [ ] Enter 3 base words, deselect all TLDs except .com and .io → only those checked
- [ ] Add custom TLD (.xyz) → appears as chip, included in next check
- [ ] Click Cancel during active check → all pending requests abort
- [ ] Filter by Available → only available rows shown
- [ ] Copy CSV → paste into spreadsheet → correct columns
- [ ] Toggle dark/light mode → all colors adapt, no hardcoded values
- [ ] Responsive: 375px → all controls accessible
- [ ] `npx tsc --noEmit` → zero errors
