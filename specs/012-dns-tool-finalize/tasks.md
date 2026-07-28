# Tasks: DNS Tool Finalize

**Input**: Design documents from `specs/012-dns-tool-finalize/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not requested. Manual browser verification and automated quality checks.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1, US2, US3)
- Include exact file paths

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No new directories needed — all target directories exist from Phase 8.

- [x] T001 Verify directories `components/dns-checker/`, `app/(dashboard)/dns-checker/`, `lib/hooks/` exist (created in Phase 8)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Enhance the hook with compare mode state and CSV logic. All new components and table changes depend on this.

- [x] T002 Enhance `useDnsChecker` in `lib/hooks/useDnsChecker.ts`:
  - Add `compareMode` state (`boolean`, default `false`) and `setCompareMode`
  - Add `compareResults` state (`(ComparisonResult | null)[]`) per data-model.md §ComparisonResult
  - In `resolveAll()`: when `compareMode` is true, run the concurrency pool twice — once per resolver — storing results into `compareResults` with `mismatch` flag computed from IP array comparison
  - Add `buildCsv()` helper: returns CSV string for single mode (`domain,status,ip`) or compare mode (`domain,cloudflare_status,...`) per contracts/ExportButton.md
  - Add analytics dispatch: `window.dispatchEvent(new CustomEvent("dns_lookup_run", { detail: { resolver, domainCount, timestamp } }))` on resolution start (aggregate only, no domains/IPs) per data-model.md §AnalyticsPayload
  - Export new values: `compareMode`, `setCompareMode`, `compareResults`, `buildCsv`

**Checkpoint**: Hook has compare mode state, CSV generation, and analytics dispatch. Ready for UI integration.

---

## Phase 3: User Story 1 - Export Results and Compare Providers (Priority: P1) 🎯 MVP

**Goal**: Add CSV export button, Compare Providers toggle, side-by-side results table, progress indicator, and graceful partial-failure display.

**Independent Test**: Resolve a batch, click "Copy CSV" → paste in spreadsheet → verify columns. Enable Compare Providers → resolve → verify both providers' results with mismatches highlighted.

### Implementation for User Story 1

- [x] T003 [P] [US1] Create `ExportButton` in `components/dns-checker/ExportButton.tsx` per contracts/ExportButton.md:
  - Shadcn/ui `Button` with `Copy` icon (lucide-react)
  - On click: build CSV via `buildCsv()` from hook, attempt `navigator.clipboard.writeText()`
  - Success: brief "Copied!" feedback
  - Failure: Blob download fallback (`new Blob([csv], { type: "text/csv" })` → `URL.createObjectURL` → temporary `<a download>` → `URL.revokeObjectURL`)
  - Disabled when no results or loading

- [x] T004 [P] [US1] Create `CompareToggle` in `components/dns-checker/CompareToggle.tsx` per contracts/CompareToggle.md:
  - Shadcn/ui `Checkbox` with label "Compare Providers"
  - Positioned adjacent to ResolverSelector
  - Disabled during active resolution (prevents mid-resolution mode switches)
  - When checked: resolver selector disabled, table shows side-by-side columns

- [x] T005 [US1] Enhance `ResultsTable` in `components/dns-checker/ResultsTable.tsx`:
  - Accept new prop `compareMode: boolean`
  - When `compareMode` is true: render 7 columns — Status (mismatch icon), Domain, Cloudflare Status, Cloudflare IPs (CopyChip), Google Status, Google IPs (CopyChip), Latency
  - Mismatch highlighting: rows where `mismatch === true` get an amber warning badge/icon in the Status column per spec FR-005
  - When `compareMode` is false: render existing 5-column layout (unchanged)

- [x] T006 [US1] Update page `app/(dashboard)/dns-checker/page.tsx`:
  - Import and wire `ExportButton`, `CompareToggle`, and new hook values (`compareMode`, `setCompareMode`, `compareResults`, `buildCsv`)
  - ResolverSelector disabled when `compareMode || isLoading`
  - ExportButton placed near SummaryBar (e.g. right-aligned in the same row)
  - Pass `compareMode` and `compareResults` to ResultsTable
  - Progress indicator already handled by Phase 8's button text `"Resolving... (N/M)"` — verify it remains functional

**Checkpoint**: CSV export and Compare Providers mode fully functional.

---

## Phase 4: User Story 2 - Integrate the Tool into the Application (Priority: P2)

**Goal**: Add DNS Checker to main navigation and bottom tab bar. Analytics event fires on resolution start.

**Independent Test**: From any page, click DNS Checker in sidebar → page loads. From mobile viewport, click DNS Checker in bottom tab → page loads.

### Implementation for User Story 2

- [x] T007 [P] [US2] Add DNS Checker link to sidebar in `components/layout/sidebar.tsx`:
  - Add `{ href: "/dns-checker", label: "DNS Checker", icon: Search }` (lucide-react `Search` icon) to the NAV_ITEMS array
  - Place after "Domains" and before "Import" in nav order per research.md §3

- [x] T008 [P] [US2] Add DNS Checker link to bottom tab bar in `components/layout/bottom-tab-bar.tsx`:
  - Add `{ href: "/dns-checker", label: "DNS Checker", icon: Search }` to the NAV_ITEMS array
  - Same order as sidebar — after "Domains", before "Import"

**Checkpoint**: DNS Checker discoverable from all navigation surfaces. Analytics fires on each resolution.

---

## Phase 5: User Story 3 - Polish, Documentation, and Ship Readiness (Priority: P3)

**Goal**: In-app help copy, automated quality checks, changelog entry, mobile QA.

**Independent Test**: Open DNS Checker page → expand Help section → verify all FAQ content. Run `npm run format && npm run lint && npm run typecheck` → all pass with zero errors.

### Implementation for User Story 3

- [x] T009 [P] [US3] Create `HelpSection` in `components/dns-checker/HelpSection.tsx` per contracts/HelpSection.md:
  - Collapsible disclosure (native `<details>` or shadcn/ui `Collapsible`) with trigger "How to use this tool"
  - "How it works" section: 3 numbered steps
  - "Supported formats" section: examples of URL, comma, newline input
  - "FAQ" section: 4 Q&A items (result differences, "No DNS" meaning, limits, privacy)
  - Default collapsed, expandable on click

- [x] T010 [P] [US3] Wire `HelpSection` into `app/(dashboard)/dns-checker/page.tsx`:
  - Render between the page header and the DomainInput, separated by a divider

- [x] T011 [US3] Run automated quality checks:
  - `npm run format` or `npx prettier --check "components/dns-checker/**/*.tsx" "lib/hooks/useDnsChecker.ts" "app/(dashboard)/dns-checker/**/*.tsx"` — must pass with zero changes
  - `npm run lint` or `npx eslint "components/dns-checker/**/*.tsx" "lib/hooks/useDnsChecker.ts" "app/(dashboard)/dns-checker/**/*.tsx"` — must pass with zero warnings
  - `npm run typecheck` or `npx tsc --noEmit` — must pass with zero errors

- [x] T012 [US3] Create `CHANGELOG.md` at repository root (if not exists) and add DNS Checker Tool entry under `## [Unreleased]` per research.md §6:
  ```markdown
  ### Added
  - DNS Checker Tool: bulk DNS A-record lookup via Cloudflare and Google DNS-over-HTTPS. Supports CSV export, Compare Providers mode, and incremental results.
  ```

- [x] T013 [US3] Mobile QA pass:
  - Test page at 375px viewport: textarea touch-friendly, table horizontal-scroll, Compare toggle not cut off, filters wrap, help section readable
  - Verify bottom tab bar shows DNS Checker icon

**Checkpoint**: Tool is documented, quality-gated, changelog-ready, and mobile-verified.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup and verification.

- [x] T014 Remove any dead code, console.log statements, or unused imports from all new and modified files
- [x] T015 Verify full exit criteria: single-resolver CSV export, Compare Providers CSV export with both providers, nav links functional on desktop and mobile, help copy complete, all 3 quality checks pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 (hook must have compareMode and buildCsv)
- **US2 (Phase 4)**: Depends on Phase 2 (hook must have analytics) — independent of US1
- **US3 (Phase 5)**: Depends on Phase 2 — independent of US1/US2
- **Polish (Phase 6)**: Depends on all user stories

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational. No dependencies on other stories.
- **US2 (P2)**: Can start after Foundational. Independent of US1/US3.
- **US3 (P3)**: Can start after Foundational. Independent of US1/US2.

### Parallel Opportunities

- T003 + T004 (different files, US1 components)
- T007 + T008 (different files, US2 nav)
- T009 + T010 (US3: component + integration)
- After Foundational: US1, US2, US3 can all run in parallel
- T011 + T012 + T013 can run in parallel (quality checks, changelog, mobile QA)

---

## Parallel Example: Post-Foundational

```bash
# All three user stories can start in parallel after Phase 2:
# Developer A — US1
Task: "Create ExportButton in components/dns-checker/ExportButton.tsx"
Task: "Create CompareToggle in components/dns-checker/CompareToggle.tsx"

# Developer B — US2
Task: "Add DNS Checker link to sidebar in components/layout/sidebar.tsx"
Task: "Add DNS Checker link to bottom tab bar in components/layout/bottom-tab-bar.tsx"

# Developer C — US3
Task: "Create HelpSection in components/dns-checker/HelpSection.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002)
3. Complete Phase 3: US1 (T003–T006)
4. **STOP and VALIDATE**: CSV export copies correctly, Compare Providers shows side-by-side with mismatches highlighted
5. MVP delivers export and provider comparison

### Incremental Delivery

1. Setup → Foundational → Foundation ready
2. Add US1 → CSV export + Compare Providers (MVP)
3. Add US2 → Nav links + analytics
4. Add US3 → Help section + quality gates + changelog
5. Polish → Cleanup + full verification

### Single Developer Strategy

1. T001 → T002 → T003 + T004 (parallel) → T005 → T006 → T007 + T008 (parallel) → T009 + T010 (parallel) → T011 + T012 + T013 → T014 + T015
2. Total: 15 tasks, ~7 sequential steps

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- Each user story independently completable and testable
- No test files — manual browser + automated tooling
- Phase 7 engine + Phase 8 UI are hard dependencies
- Commit after each logical group
