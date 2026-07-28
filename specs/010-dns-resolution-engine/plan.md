# Implementation Plan: Core DNS Resolution Engine

**Branch**: `010-dns-resolution-engine` | **Date**: 2026-07-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/010-dns-resolution-engine/spec.md`

## Summary

Build a pure, framework-agnostic TypeScript module under `lib/dns/` that performs DNS A-record resolution via DNS-over-HTTPS (DoH) against Cloudflare and Google public resolvers. No backend, no UI — just the engine: types, provider configs, single/batch resolution, and raw-text domain parsing. Designed to be called from browser or Node.js using only standard `fetch` and `AbortController`.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)

**Primary Dependencies**: None — relies only on standard `fetch`, `AbortController`, `Promise.allSettled`. No npm packages required.

**Storage**: N/A — stateless client-side module. No database tables, no Supabase.

**Testing**: Manual QA via browser console and Vercel preview deploys. TypeScript compiler as safety net.

**Target Platform**: Web browser + Node.js (any runtime with `fetch` and `AbortController`). No server required.

**Project Type**: Library module within existing Next.js web application. Pure functions, no React components.

**Performance Goals**: Single domain resolution <5s. Batch of 50 domains <30s at default concurrency (20). Zero bundle size impact on pages that don't import the module.

**Constraints**: No UI framework dependencies. No Node.js-specific APIs (no `dns` module, no `net` module). Functions must be tree-shakeable. No stateful singletons — every call is stateless.

**Scale/Scope**: 4 new files under `lib/dns/`:
- `types.ts` — shared type definitions
- `providers.ts` — resolver endpoint configs
- `resolve.ts` — single + batch resolution functions
- `parseInput.ts` — raw text → domain list parser

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Data Integrity & Security | ✅ PASS | No data stored. No credentials. No user PII. Public DoH endpoints only. No RLS concerns. |
| II. Architecture Discipline | ✅ PASS | Pure module under `lib/dns/`. No React components. No API routes. No Supabase. Imported only where needed — tree-shakeable. |
| III. UX Excellence & Accessibility | N/A | No UI delivered in this phase. UX handled in Phase 8. |
| IV. Code Quality & Performance | ✅ PASS | TypeScript strict. Zero dependencies. Batch concurrency cap prevents browser connection exhaustion. All error paths return typed results, never throw. |
| V. Phased Delivery & Verification | ✅ PASS | Independent Phase 7 delivering the core engine. Exit criteria: `resolveBatch(["google.com"], "cloudflare")` returns IPv4. TypeScript clean. |

## Project Structure

### Documentation (this feature)

```text
specs/010-dns-resolution-engine/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── resolveDomain.md
│   ├── resolveBatch.md
│   └── parseInput.md
└── tasks.md             # Phase 2 output — NOT created by plan
```

### Source Code (repository root)

```text
# New files for Phase 7

lib/dns/
├── types.ts             # Resolver, DnsStatus, DnsResult types
├── providers.ts         # Cloudflare + Google endpoint configs
├── resolve.ts           # resolveDomain(), resolveBatch()
└── parseInput.ts        # parseDomainList(rawText) → string[]
```

**Structure Decision**: Single directory `lib/dns/` under the existing `lib/` folder, following the same pattern as `lib/sedo/` (Phase 5) and `lib/spaceship/` (Phase 6). Each file has a single responsibility. No new directories outside `lib/dns/`. No modifications to existing files.

## Complexity Tracking

> No constitution violations. No complexity justifications needed.
