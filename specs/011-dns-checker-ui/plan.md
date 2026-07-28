# Implementation Plan: DNS Checker UI

**Branch**: `011-dns-checker-ui` | **Date**: 2026-07-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/011-dns-checker-ui/spec.md`

## Summary

Build the interactive DNS Checker page — a client-side tool where users paste domains, choose a resolver (Cloudflare/Google), trigger DNS resolution, and view results in a filterable table with incremental updates, clickable domain links, and copy-to-clipboard IP chips. Purely client-side; no server routes, no database. Uses the Phase 7 `lib/dns/` engine.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Next.js 14+ App Router

**Primary Dependencies**: @tanstack/react-query v5 (state management), react-hook-form (optional), lucide-react (icons), shadcn/ui (UI components), lib/dns/ (Phase 7 engine). All already in the project.

**Storage**: N/A — no database, no Supabase. All state is transient client-side state.

**Testing**: Manual QA via Vercel preview deploys. TypeScript compiler as safety net.

**Target Platform**: Web — Next.js on Vercel. Responsive 375px–1920px.

**Project Type**: Web application page — single client component page, no API routes, no server rendering.

**Performance Goals**: First result visible <3s (50-domain batch). Filter toggle <50ms. Page load <2s on 3G. Zero console errors on navigation away.

**Constraints**: `"use client"` only — no SSR. No credentials stored. No backend calls. Must cancel in-flight requests on unmount. Must reuse existing design system (shadcn/ui + design tokens). Zero TypeScript errors. Coexists with existing dashboard pages without layout regressions.

**Scale/Scope**: 1 new page route. 4 new components. 1 new hook. No new dependencies. No modified existing files (unless adding to global nav).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Data Integrity & Security | ✅ PASS | No data stored, no credentials, no PII. All DNS lookups happen client-side via public DoH. Domain links open with `rel="noopener noreferrer"`. No backend transmission. |
| II. Architecture Discipline | ✅ PASS | Single `"use client"` page. TanStack Query for state management per constitution. No API routes. Shadcn/ui components per design system. lib/dns/ import follows existing lib pattern. |
| III. UX Excellence & Accessibility | ✅ PASS | Dark/light themes from design tokens. Keyboard shortcut (Ctrl/Cmd+Enter). Responsive 375px–1920px. Loading indicator, empty states, error display. Copy-to-clipboard with visual feedback. |
| IV. Code Quality & Performance | ✅ PASS | TypeScript strict. Incremental results (no blocking). Concurrency control via Phase 7 engine. AbortController cleanup on unmount. No per-row API calls — engine handles batching. |
| V. Phased Delivery & Verification | ✅ PASS | Independent Phase 8. Full DoD: typecheck clean, manual browser test per exit criteria. Builds on Phase 7 engine as documented dependency. |

## Project Structure

### Documentation (this feature)

```text
specs/011-dns-checker-ui/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── useDnsChecker.md
│   ├── DomainInput.md
│   ├── ResolverSelector.md
│   └── ResultsTable.md
└── tasks.md             # Phase 2 output — NOT created by plan
```

### Source Code (repository root)

```text
# New files for Phase 8

app/(dashboard)/dns-checker/
└── page.tsx                       # Client page — orchestrates all components + hook

components/dns-checker/
├── DomainInput.tsx                # Textarea + live domain count + validation warnings
├── ResolverSelector.tsx           # Cloudflare / Google toggle (SegmentedControl/ToggleGroup)
├── ResultsTable.tsx               # Table: status, domain (link), IP chips, resolver, latency
└── SummaryBar.tsx                 # Filter pills: All / DNS OK / No DNS with live counts

lib/hooks/
└── useDnsChecker.ts               # State: domains, resolver, results, filter, isLoading
                                   # Calls parseDomainList() + resolveDomain() (incremental)
                                   # Manages AbortController lifecycle
```

**Modified files**:
```
components/layout/
└── sidebar.tsx (or main-nav.tsx)  # [MAYBE UPDATED] — Add DNS Checker link to nav
```

**Structure Decision**: Follows the existing tool pattern — page under `app/(dashboard)/`, components under `components/dns-checker/`, hook under `lib/hooks/`. The `SummaryBar` is extracted from `ResultsTable` as a separate component for cleaner state management (filter lives in the hook, passed down). No new API routes. No new lib modules beyond the hook.

## Complexity Tracking

> No constitution violations. No complexity justifications needed.
