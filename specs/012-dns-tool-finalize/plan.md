# Implementation Plan: DNS Tool Finalize

**Branch**: `012-dns-tool-finalize` | **Date**: 2026-07-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/012-dns-tool-finalize/spec.md`

## Summary

Finalize the DNS Checker Tool with three additions: (1) CSV export and Compare Providers mode (resolves against both Cloudflare and Google side-by-side, highlights IP mismatches), (2) app navigation integration and analytics, (3) polish — format/lint/typecheck, in-app help copy, changelog entry, and mobile QA. All changes are client-side; no backend routes or database changes.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Next.js 14+ App Router

**Primary Dependencies**: Existing project stack — no new npm packages. Uses `navigator.clipboard`, `Blob`/`URL.createObjectURL` (for download fallback), existing shadcn/ui components.

**Storage**: N/A — stateless client-side. No database changes.

**Testing**: Manual QA via Vercel preview deploys. TypeScript + ESLint + Prettier for automated quality checks.

**Target Platform**: Web — Next.js on Vercel. Responsive 375px–1920px.

**Project Type**: Web application page enhancements — modifying existing components and adding new sub-components.

**Performance Goals**: CSV clipboard copy <100ms. Compare Providers mode resolves 50 domains <40s. All quality checks pass with zero errors.

**Constraints**: No new dependencies. No server routes. No database. Analytics must be non-blocking and exclude domain/IP data per privacy requirements. English-only — no i18n.

**Scale/Scope**: Modifications to 3 existing files (sidebar, bottom-tab-bar, page.tsx). 3 new components (ExportButton, CompareToggle, HelpSection). 1 new hook update (useDnsChecker adds compareMode). 1 new doc file (CHANGELOG.md entry).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Data Integrity & Security | ✅ PASS | No data stored. Analytics events exclude domain names and IPs — only aggregate counts. Clipboard API is browser-native. Blob download uses memory-only temporary URL. No PII exposure. |
| II. Architecture Discipline | ✅ PASS | Client-side only. No API routes. Components follow existing patterns. Modified files: sidebar.tsx and bottom-tab-bar.tsx for nav link, page.tsx for new UI sections. |
| III. UX Excellence & Accessibility | ✅ PASS | Compare toggle is visually adjacent to resolver selector (natural UX). CSV download fallback for non-HTTPS contexts. In-app help copy explains tool usage. Mobile QA pass per constitution breakpoints. |
| IV. Code Quality & Performance | ✅ PASS | TypeScript strict. CSV string built with template literals (O(n) performance). Compare mode doubles resolution calls but reuses existing concurrency pool. Format/lint/typecheck gates enforced. |
| V. Phased Delivery & Verification | ✅ PASS | Independent Phase 9+10+13 combined. Depends on Phase 7 (engine) and Phase 8 (UI). Full DoD checklist. |

## Project Structure

### Documentation (this feature)

```text
specs/012-dns-tool-finalize/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── ExportButton.md
│   ├── CompareToggle.md
│   └── HelpSection.md
└── tasks.md             # Phase 2 output — NOT created by plan
```

### Source Code (repository root)

```text
# New files

components/dns-checker/
├── ExportButton.tsx           # "Copy CSV" button + clipboard/download logic
├── CompareToggle.tsx          # "Compare Providers" checkbox/toggle next to resolver
├── HelpSection.tsx            # In-app help copy + FAQ section

# Modified files

components/dns-checker/
└── ResultsTable.tsx            # [UPDATED] — Add side-by-side columns for compare mode

app/(dashboard)/dns-checker/
└── page.tsx                    # [UPDATED] — Wire ExportButton, CompareToggle, HelpSection; pass compareMode to hook

lib/hooks/
└── useDnsChecker.ts            # [UPDATED] — Add compareMode state, dual-resolution logic, updated CSV generation

components/layout/
├── sidebar.tsx                 # [UPDATED] — Add DNS Checker nav link
└── bottom-tab-bar.tsx          # [UPDATED] — Add DNS Checker nav link (mobile)

CHANGELOG.md                    # [NEW or UPDATED] — Add DNS Checker Tool entry
```

**Structure Decision**: Follows Phase 8 conventions. New components in `components/dns-checker/`. Hook enhancement in-place. Nav links added to existing layout components. No new API routes or lib modules.

## Complexity Tracking

> No constitution violations. No complexity justifications needed.
