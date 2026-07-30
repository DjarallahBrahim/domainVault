# Tasks: TLD Reservation Checker

**Input**: Design documents from `/specs/013-tld-reservation-checker/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the TLD checker directory structure and engine foundation

- [x] T001 Create `lib/tld/` directory structure matching `lib/dns/` pattern
- [x] T002 [P] Define TldCheckStatus and TldCheckResult types in `lib/tld/types.ts`
- [x] T003 [P] Define TldProvider configs (Cloudflare DoH for NS) in `lib/tld/providers.ts`
- [x] T004 Create `components/tld-checker/` and `app/(dashboard)/tld-checker/` directories

---

## Phase 2: Foundational — Core Engine (Blocking Prerequisites)

**Purpose**: Engine code that all UI components depend on — MUST complete before any UI work

**⚠️ CRITICAL**: No UI component work can begin until this phase is complete

- [x] T005 Implement `parseBaseWords()` in `lib/tld/parseInput.ts` — accept any-separator input, sanitize to `[a-zA-Z0-9-]`, lowercase, deduplicate, max 200 words, return `{ words }` or `{ error }`
- [x] T006 Implement `checkAvailability()` in `lib/tld/resolve.ts` — fetch NS records via Cloudflare DoH, interpret NXDOMAIN → "available", NS records → "registered", HTTP/parse error → "error", 5s timeout, abort signal support
- [x] T007 Implement `checkAvailabilityBatch()` in `lib/tld/resolve.ts` — accept `(domains, options)`, reuse `runWithConcurrency` pattern from `lib/dns/resolve.ts` with 20 concurrent, return `TldCheckResult[]`
- [x] T008 Verify `npx tsc --noEmit` passes on `lib/tld/` files

**Checkpoint**: Engine ready — UI implementation can now begin

---

## Phase 3: User Story 1 — Check Domain Availability Across TLDs (Priority: P1) 🎯 MVP

**Goal**: User enters base words, selects TLDs, clicks Check, and sees availability results in a table

**Independent Test**: Enter "acmecorp", select .com/.io/.ai, click Check — see acmecorp.com → Registered, acmecorp.io → Available, acmecorp.ai → Registered (or real-world equivalents) within 30 seconds

### Implementation for User Story 1

- [x] T009 [P] [US1] Build `useTldChecker` hook beta in `lib/hooks/useTldChecker.ts` — rawInput/parsedWords state, selectedTlds (hardcoded defaults for now), checkAll() that builds (word × tld) combos and calls `checkAvailabilityBatch()`, isLoading/progress/canCheck, abortRef
- [x] T010 [P] [US1] Create `ResultsTable.tsx` in `components/tld-checker/ResultsTable.tsx` — columns: Status icon (CheckCircle for available / Globe for registered / AlertCircle for error), Domain link (word.tld opens in new tab), Status text label, response time; skeleton rows during loading; empty state prompt
- [x] T011 [P] [US1] Create `DomainInput.tsx` in `components/tld-checker/DomainInput.tsx` — monospace textarea with `// WORDS` section label, word count helper text below, error display, disabled state during loading
- [x] T012 [US1] Create `SkeletonRow.tsx` in `components/tld-checker/SkeletonRow.tsx` — animated skeleton row matching results table column widths
- [x] T013 [US1] Create `app/(dashboard)/tld-checker/page.tsx` — assemble TitleBar (traffic-light dots + query.tld label), SectionLabel helper, DomainInput, basic TLD toggle (hardcoded), Check button with progress counter, ResultsTable; wire to useTldChecker hook
- [x] T014 [US1] Verify — enter 1–3 words with default TLDs, click Check, confirm real availability results appear; click Cancel mid-check; verify `npx tsc --noEmit` passes

**Checkpoint**: US1 functional — core availability check works end-to-end

---

## Phase 4: User Story 2 — Configure TLD Selection (Priority: P2)

**Goal**: User can toggle default TLDs and add custom TLDs; selection persists across page reloads within the session

**Independent Test**: Deselect all TLDs except .com and .io, verify only those are queried. Add .xyz as custom TLD, verify it joins the selection. Reload page, verify custom .xyz is still selected.

### Implementation for User Story 2

- [x] T015 [P] [US2] Create `TldPicker.tsx` in `components/tld-checker/TldPicker.tsx` — default TLD chip grid (.com/.net/.org/.io/.ai/.co/.app/.dev), toggle on/off with filled/outline styles, custom TLD input field with Enter-to-add, `// TLDS` section label, disabled state during loading
- [x] T016 [US2] Update `useTldChecker` hook in `lib/hooks/useTldChecker.ts` — add toggleTld/addCustomTld handlers, initialize selectedTlds from sessionStorage with defaults fallback on first visit, persist on every change, disable check when 0 TLDs selected
- [x] T017 [US2] Integrate TldPicker into page in `app/(dashboard)/tld-checker/page.tsx` — replace hardcoded TLD toggle with TldPicker component, wire selectedTlds/toggleTld/addCustomTld from hook
- [x] T018 [US2] Verify — toggle TLDs, add custom .xyz, reload page and confirm persistence; verify 0 TLDs selected disables Check button; verify TLD picker is disabled during active lookup

**Checkpoint**: US2 functional — TLD selection complete with persistence

---

## Phase 5: User Story 3 — Filter, Export, and Analyze Results (Priority: P1)

**Goal**: User sees stat summary cards, can filter results by status, and can export filtered results to CSV

**Independent Test**: Run check for "acmecorp" across 10 TLDs, see stats with correct counts. Click "Available" filter pill, verify only available rows shown. Click "Copy CSV", paste into spreadsheet — verify word/tld/domain/status columns.

### Implementation for User Story 3

- [x] T019 [P] [US3] Update `useTldChecker` hook in `lib/hooks/useTldChecker.ts` — add filter/onFilterChange state, filteredResults derivation, counts derivation (all/available/registered/reserved/error from results), buildCsv() serializing filtered results to `word,tld,domain,status` CSV string
- [x] T020 [P] [US3] Create `StatCards.tsx` in `components/tld-checker/StatCards.tsx` — 4-card grid (Total/accent-primary, Available/accent-success, Registered/accent-warning, Error/accent-danger), clickable to set filter, active filter elevated; `// STATS` section label
- [x] T021 [P] [US3] Create `FilterPills.tsx` in `components/tld-checker/FilterPills.tsx` — horizontal pill row (All/ Available/Registered/Error) with counts, active=filled, inactive=outline, click to change filter
- [x] T022 [P] [US3] Create `ExportButton.tsx` in `components/tld-checker/ExportButton.tsx` — "Copy CSV" button with Copy icon, clipboard writeText() + Blob download fallback, Check icon + "copied" feedback for 1.5s, disabled when loading or no results
- [x] T023 [US3] Integrate into page in `app/(dashboard)/tld-checker/page.tsx` — add StatCards (conditional on counts.all > 0), add FilterPills above ResultsTable (conditional on counts.all > 0 || isLoading), add ExportButton in controls bar, wire all hook state
- [x] T024 [US3] Verify — check counts accuracy, filter by each status and confirm rows match, copy CSV and paste into spreadsheet, verify disabled state during loading

**Checkpoint**: US3 functional — filtering, stats, and export complete

---

## Phase 6: User Story 4 — Integrate with App Navigation and Help (Priority: P2)

**Goal**: TLD Checker is discoverable from sidebar/mobile nav and has in-app help documentation

**Independent Test**: From any page, locate "TLD Checker" in sidebar. Click to load the tool. Scroll to bottom, expand help section, verify FAQ covers privacy, rate limits, and why some lookups fail.

### Implementation for User Story 4

- [x] T025 [P] [US4] Create `HelpSection.tsx` in `components/tld-checker/HelpSection.tsx` — collapsible with `// how to use this tool` comment-style trigger, content sections: Input formats, TLD selection, Status meanings (Available/Registered/Error), FAQ (privacy/rate limits/NS limitation/why some lookups show Registered when actually premium — note DNS-based heuristic limits)
- [x] T026 [P] [US4] Add TLD Checker nav link in `components/layout/sidebar.tsx` — position near existing DNS Checker link, use Globe or Search icon, label "TLD Checker"
- [x] T027 [P] [US4] Add TLD Checker nav link in `components/layout/bottom-tab-bar.tsx` — position near existing DNS Checker link, same icon/label
- [x] T028 [US4] Add analytics event in `lib/hooks/useTldChecker.ts` — trigger `tld_check_run` on checkAll() with { wordCount, tldCount, totalCombinations }, non-blocking try/catch
- [x] T029 [US4] Integrate HelpSection into page in `app/(dashboard)/tld-checker/page.tsx` — place below subtitle, above the editor window
- [x] T030 [US4] Verify — navigate from sidebar/mobile to TLD Checker, expand help and read FAQ, check analytics event fires in console, verify nav links are positioned correctly in both light/dark modes

**Checkpoint**: US4 functional — tool discoverable and documented

---

## Phase 7: User Story 5 — Visual Polish: Terminal/Code-Editor Aesthetic (Priority: P3)

**Goal**: TLD Checker matches the DNS Checker's terminal/code-editor visual style — traffic-light title bar, monospace font, comment-style labels, theme-aware semantic colors, no hardcoded values

**Independent Test**: Load TLD Checker in light mode — verify container styling, title bar dots, comment labels, monospace fonts. Toggle to dark mode — verify all colors adapt. Search codebase for hardcoded color classes (emerald-500, amber-500, etc.) — none found in tld-checker files.

### Implementation for User Story 5

- [x] T031 [P] [US5] Audit and fix all `components/tld-checker/` files — ensure every color uses CSS variable tokens (`text-accent-success`/`text-accent-danger`/`text-accent-primary`/`bg-bg-surface`/`border-border`/`text-muted-foreground`); replace any hardcoded Tailwind color classes
- [x] T032 [P] [US5] Audit page styling in `app/(dashboard)/tld-checker/page.tsx` — ensure terminal container (`rounded-xl border border-border bg-bg-surface`), TitleBar with traffic-light dots + query.tld label, `font-mono` on textarea/section labels, SectionLabel comments (`// WORDS`, `// TLDS`, `// CONTROLS`, `// STATS`, `// RESULTS`)
- [x] T033 [P] [US5] Ensure StatCards use semantic accent rings per spec — accent-success (Available), accent-warning (Registered), accent-primary (Total), accent-danger (Error); ensure FilterPills use matching semantic token backgrounds/outlines
- [x] T034 [P] [US5] Ensure TLD chips use project pill/badge styling — selected: `bg-accent-primary/10 border-accent-primary text-accent-primary`, deselected: `border-border text-muted-foreground`; monospace TLD labels
- [x] T035 [US5] Verify full visual parity with DNS Checker — compare both pages side-by-side in light and dark modes, verify all breakpoints work (375px mobile through 1920px desktop), verify `npx tsc --noEmit` passes
- [x] T036 [US5] Final cleanup — remove any dead code, debug logs, or unused imports; confirm `npx tsc --noEmit` passes with zero errors on all project files

**Checkpoint**: US5 functional — tool matches DNS Checker visual style

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational (Phase 2)
- **US2 (Phase 4)**: Depends on US1 (Phase 3) — needs the hook + page from US1
- **US3 (Phase 5)**: Depends on US2 (Phase 4) — needs results + hook from US1/US2
- **US4 (Phase 6)**: Depends on US3 (Phase 5) — needs the full page to integrate nav/help
- **US5 (Phase 7)**: Depends on US4 (Phase 6) — polishes the complete page

### User Story Dependencies

- **US1 (P1)**: Core engine + basic page — no dependencies on other stories
- **US2 (P2)**: TLD picker — depends on US1 page/hook skeleton, but TldPicker component and hook updates can run in parallel once US1's file structure exists
- **US3 (P1)**: Filter/export/stats — depends on US1+US2 (needs results and count derivation from hook)
- **US4 (P2)**: Nav + help — depends on US3 (page must be complete before nav integration)
- **US5 (P3)**: Visual polish — depends on US4 (all components exist before style audit)

### Within Each User Story

- Hook updates before component creation when new state is needed
- Components can run in parallel with each other (different files)
- Integration task always last (wires everything in page.tsx)
- Verify task always after integration

### Parallel Opportunities

- **Phase 1**: T002 + T003 can run in parallel (different files: types.ts, providers.ts)
- **Phase 3 (US1)**: T009 + T010 + T011 can run in parallel (hook, ResultsTable, DomainInput — different files)
- **Phase 5 (US3)**: T019 + T020 + T021 + T022 can run in parallel (hook update, StatCards, FilterPills, ExportButton — all different files)
- **Phase 6 (US4)**: T025 + T026 + T027 can run in parallel (HelpSection, sidebar, bottom-tab-bar — all different files)
- **Phase 7 (US5)**: T031 + T032 + T033 + T034 can run in parallel (all component audits — different files)

---

## Parallel Example: User Story 1

```bash
# Launch all US1 tasks in parallel:
Task: "Build useTldChecker hook beta in lib/hooks/useTldChecker.ts"
Task: "Create ResultsTable.tsx in components/tld-checker/ResultsTable.tsx"
Task: "Create DomainInput.tsx in components/tld-checker/DomainInput.tsx"

# Then sequentially:
Task: "Create SkeletonRow.tsx in components/tld-checker/SkeletonRow.tsx"  # (depends on table design)
Task: "Create app/(dashboard)/tld-checker/page.tsx"  # (assembles all components)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational engine (`lib/tld/`)
3. Complete Phase 3: US1 (core page + hook + table)
4. **STOP and VALIDATE**: Check real domains, verify statuses are correct
5. Deploy/demo if ready — the tool already provides value

### Incremental Delivery

1. Setup + Foundational → Engine is ready
2. Add US1 → Basic availability check works → **MVP!**
3. Add US2 → TLD selection with defaults + custom → full configuration
4. Add US3 → Filtering + stats + CSV export → complete analysis toolkit
5. Add US4 → Nav integration + help docs → production-ready
6. Add US5 → Visual polish → matches app aesthetic

### Single Developer Path

Follow the phases sequentially (1 → 2 → 3 → 4 → 5 → 6 → 7). Each checkpoint validates the increment before moving on. Story-level commits recommended after each phase.

---

## Notes

- [P] tasks = different files, no dependencies between them
- [US*] label maps task to specific user story for traceability
- Each phase has a verify task (last in phase) — do not skip
- Run `npx tsc --noEmit` after each phase; fix errors before proceeding
- Commit after each phase checkpoint
- Reuse patterns from `lib/dns/` and `components/dns-checker/` wherever possible — the DNS Checker is the canonical reference implementation
- No database changes. No API routes. No new dependencies.
