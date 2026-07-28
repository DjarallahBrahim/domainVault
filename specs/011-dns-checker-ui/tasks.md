# Tasks: DNS Checker UI

**Input**: Design documents from `specs/011-dns-checker-ui/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not requested in feature specification. Manual verification via browser and TypeScript compiler.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

All source files live within the existing Next.js project repository under `app/(dashboard)/`, `components/`, and `lib/hooks/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create required directories — no tooling changes needed.

- [x] T001 Create directory `components/dns-checker/` if it does not exist
- [x] T002 Create directory `app/(dashboard)/dns-checker/` if it does not exist

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Central hook that ALL components and the page depend on.

**⚠️ CRITICAL**: No component or page work can begin until this phase is complete.

- [x] T003 Implement `useDnsChecker` hook in `lib/hooks/useDnsChecker.ts` per contracts/useDnsChecker.md:
  - State: `rawInput`, `parsedDomains`, `parseError`, `resolver`, `results`, `isLoading`, `filter`, `progress`
  - Debounced parsing (300ms) via `parseDomainList()` from `lib/dns/parseInput.ts`
  - `resolveAll()`: concurrency pool (cap 20) calling `resolveDomain()` per-domain from `lib/dns/resolve.ts`
  - Incremental results: update `results[i]` as each `resolveDomain` promise resolves
  - Concurrent prevention: guard `resolveAll()` on `isLoading`; disable trigger while loading
  - AbortController lifecycle: create on resolve, abort on unmount via `useEffect` cleanup
  - Derived values: `canResolve`, `filteredResults`, `counts`
  - Keyboard shortcut: `useEffect` with `keydown` listener for `Ctrl+Enter` / `Meta+Enter`

**Checkpoint**: Hook is functional — all state management, resolution, parsing, and cleanup logic in place.

---

## Phase 3: User Story 1 - Paste and Resolve a Single Domain (Priority: P1) 🎯 MVP

**Goal**: Build the page with all four components and wire them to the hook. A user can navigate to the DNS Checker, enter a domain, select a resolver, trigger resolution, and see results in the table.

**Independent Test**: Navigate to `/dns-checker`, type `"google.com"`, click Resolve (or Ctrl+Enter), verify the results table shows a row with status "DNS OK", at least one IPv4 address, and latency.

### Implementation for User Story 1

- [x] T004 [P] [US1] Create `DomainInput` in `components/dns-checker/DomainInput.tsx` per contracts/DomainInput.md:
  - Textarea (shadcn/ui `Textarea`) with monospace font, 6-row minimum, resizable
  - Live domain count display below textarea (`"{N} domains detected"`)
  - Parse error display (red alert when `error` prop is non-null)
  - Loading state: subtle border pulse, textarea remains editable

- [x] T005 [P] [US1] Create `ResolverSelector` in `components/dns-checker/ResolverSelector.tsx` per contracts/ResolverSelector.md:
  - ToggleGroup (shadcn/ui) with "Cloudflare" and "Google" options
  - Single-select behavior, "Cloudflare" default
  - Disabled state when `isLoading` (greyed out, non-interactive)

- [x] T006 [P] [US1] Create `ResultsTable` in `components/dns-checker/ResultsTable.tsx` per contracts/ResultsTable.md:
  - 5 columns: Status (icon/badge), Domain (clickable link), IPs (text for now — copy added in US3), Resolver, Latency
  - Row states: resolved row, pending skeleton row (null entries), error row
  - No results empty state: "Enter domains above and click Resolve to see results"

- [x] T007 [P] [US1] Create `SummaryBar` in `components/dns-checker/SummaryBar.tsx` per data-model.md:
  - Three filter pills: "All (N)", "DNS OK (N)", "No DNS (N)"
  - Active pill highlighted, click toggles filter
  - Counts update live from hook

- [x] T008 [US1] Create page `app/(dashboard)/dns-checker/page.tsx` per quickstart.md:
  - `"use client"` directive
  - Instantiate `useDnsChecker` hook
  - Layout: DomainInput → ResolverSelector + Resolve Button → SummaryBar → ResultsTable
  - Resolve button: uses `Button` (shadcn/ui), shows progress `"Resolving... (N/M)"` when loading, disabled when `!canResolve`
  - Wire keyboard shortcut handler (handled in hook, page just provides the resolve function)

**Checkpoint**: Full end-to-end flow works — paste a domain, click Resolve, see result in table with correct status.

---

## Phase 4: User Story 2 - Paste and Resolve Multiple Domains in Bulk (Priority: P2)

**Goal**: Ensure bulk resolution produces live, incremental updates. The domain count updates as the user types. Results appear row-by-row. Concurrent resolution is blocked.

**Independent Test**: Paste `"google.com\ncloudflare.com\nnot-a-real-domain-12345.com"`, verify live count shows "3 domains detected", click Resolve, confirm rows appear incrementally (not all at once), and the resolve button is disabled during resolution.

### Implementation for User Story 2

- [x] T009 [US2] Enhance `ResultsTable` in `components/dns-checker/ResultsTable.tsx`:
  - Skeleton shimmer rows for `null` entries (pending resolution) — one skeleton per unresolved domain
  - Live row replacement: skeleton → resolved row as each result arrives

**Checkpoint**: Bulk resolution with incremental row updates and blocked re-resolution is fully functional.

---

## Phase 5: User Story 3 - Filter and Navigate Results (Priority: P3)

**Goal**: Add result filtering, clickable domain links, IP copy-to-clipboard, and empty states for unmatched filters.

**Independent Test**: After resolving a mixed batch, click "DNS OK" filter pill → only resolved rows visible. Click "No DNS" → only non-resolved rows visible. Click a domain name → opens in new tab. Click an IP chip → "Copied!" feedback. Click "All" → all rows visible.

### Implementation for User Story 3

- [x] T010 [US3] Enhance `ResultsTable` in `components/dns-checker/ResultsTable.tsx`:
  - Domain column: render as `<a href="https://{domain}" target="_blank" rel="noopener noreferrer">` per spec FR-007
  - IP column: replace text display with clickable chips (shadcn/ui `Badge`) that call `navigator.clipboard.writeText(ip)` on click per spec FR-008
  - Copy feedback: brief "Copied!" tooltip (shadcn/ui `Tooltip`) on successful copy, graceful no-op on clipboard API failure per research.md §6
  - Filter empty state: when `filter !== "all"` and `filteredResults` is empty, show "No matching results" with suggestion to change filter per spec FR-013

**Checkpoint**: Filter pills correctly partition rows, domain links open in new tabs, IP chips copy to clipboard with visual feedback.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verification, mobile responsiveness, and cleanup.

- [x] T011 Ensure mobile responsiveness: test page at 375px — textarea full width, controls stack vertically, table horizontal-scroll, IP chips wrap per research.md §4
- [x] T012 Run TypeScript typecheck (`npx tsc --noEmit` or `npm run typecheck`) — must pass with zero errors
- [x] T013 Verify exit criteria per quickstart.md: paste 3 domains, resolve, verify incremental rows, filter pills work, domain links open in new tab, IP copy works, Ctrl+Enter triggers resolve, button disables during loading
- [x] T014 Remove any dead code, console.log debugging statements, or unused imports from all new files

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion (T001, T002) — BLOCKS all user stories
- **User Stories (Phase 3–5)**: All depend on Foundational phase completion (T003)
  - US1 (T004–T008): Can start after T003. Components (T004–T007) can run in parallel.
  - US2 (T009): Depends on US1 completion (needs ResultsTable from T006).
  - US3 (T010): Depends on US1 completion (needs ResultsTable from T006).
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational. No dependencies on other stories.
- **User Story 2 (P2)**: Depends on US1 (enhances ResultsTable built in T006).
- **User Story 3 (P3)**: Depends on US1 (enhances ResultsTable built in T006). Independent of US2.

### Within Each User Story

- US1: T004, T005, T006, T007 (components) can run in parallel → T008 (page) sequentially after components
- US2: T009 depends on US1's ResultsTable
- US3: T010 depends on US1's ResultsTable

### Parallel Opportunities

- T001 + T002 (different directories)
- T004 + T005 + T006 + T007 (different files in US1)
- T009 + T010 (different concerns in same file — but one after US1, can run in parallel with each other since they touch different parts of ResultsTable)
- T011 + T012 (different validation tasks)

---

## Parallel Example: US1 Components

```bash
# Launch all four components together (different files):
Task: "Create DomainInput in components/dns-checker/DomainInput.tsx"
Task: "Create ResolverSelector in components/dns-checker/ResolverSelector.tsx"
Task: "Create ResultsTable in components/dns-checker/ResultsTable.tsx"
Task: "Create SummaryBar in components/dns-checker/SummaryBar.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001, T002)
2. Complete Phase 2: Foundational (T003)
3. Complete Phase 3: User Story 1 (T004–T008)
4. **STOP and VALIDATE**: Navigate to `/dns-checker`, enter `"google.com"`, click Resolve, verify result
5. MVP delivers a working DNS checker page with single/basic resolution

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Working page with full resolution (MVP)
3. Add User Story 2 → Test independently → Bulk resolution with incremental updates
4. Add User Story 3 → Test independently → Filters, domain links, IP copy
5. Polish → TypeScript clean, mobile responsive, exit criteria verified

### Single Developer Strategy

1. T001 + T002 → T003 → T004 + T005 + T006 + T007 (parallel) → T008 → T009 → T010 → T011 + T012 + T013 → T014
2. Total: 14 tasks, ~6 sequential steps

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- No test files — testing via manual browser and TypeScript compiler
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Phase 7 engine (`lib/dns/`) is a hard dependency — must be complete before this phase
