# Research: DNS Checker UI

**Feature**: 011-dns-checker-ui | **Date**: 2026-07-28

## Research Tasks

### 1. Incremental Result Rendering Strategy

**Decision**: The `useDnsChecker` hook calls `resolveDomain()` individually for each domain with its own concurrency control, rather than calling `resolveBatch()`. As each `resolveDomain()` promise resolves, the hook updates its `results` state array at the corresponding index, triggering a re-render that adds the new row to the table.

**Rationale**:
- `resolveBatch()` returns all results at once (clarified in Phase 7 spec: Option A)
- For incremental UI updates, we need per-result callbacks/interleaving
- Calling `resolveDomain()` individually with a concurrency pool in the hook gives us incremental updates naturally
- Each resolved domain triggers a state update → React re-renders the table with one more row
- The concurrency pool in the hook mirrors `resolveBatch()` logic but exposes results progressively

**Alternatives considered**:
- Polling `resolveBatch()` — defeats the purpose of incremental updates
- Async generator pattern in Phase 7 engine — rejected during Phase 7 clarification
- Web Workers — overkill for this use case; adds complexity

### 2. Concurrent Resolution Prevention

**Decision**: The hook maintains an `isLoading` boolean. When `true`, the resolve button is disabled and the keyboard shortcut handler short-circuits. The hook also stores the current `AbortController`; a new resolution creates a fresh controller.

**Rationale**:
- Simple boolean gate prevents all trigger paths (button, keyboard, programmatic)
- Reuses the existing `isLoading` state — no extra flags needed
- Follows the clarification decision (Option B: block, don't cancel)

**Alternatives considered**:
- Queue the new batch — adds complexity, user wait UX is poor for long batches
- Cancel and restart (Option A) — rejected during clarification

### 3. Keyboard Shortcut Implementation

**Decision**: Use `useEffect` with a `keydown` event listener on `window`. The handler checks for `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (Mac). Short-circuits if `isLoading` is true. Listener is cleaned up on unmount.

**Rationale**:
- `Ctrl+Enter` / `Cmd+Enter` is a common web app shortcut convention
- Global window listener ensures it works regardless of focus (textarea, button, anywhere on page)
- Short-circuit on `isLoading` enforces concurrent resolution prevention
- No external library needed

**Alternatives considered**:
- `onKeyDown` on the textarea only — would not work when focus is on the resolve button
- Dedicated keyboard shortcut library — unnecessary dependency for one shortcut

### 4. Mobile Responsiveness Strategy

**Decision**: Use responsive Tailwind classes. Input area: full-width textarea at all breakpoints. Resolver selector: toggle group. Results table: horizontal-scroll container on mobile, standard table on desktop. IP chips: wrap flex container. Filter pills: horizontal scroll or flex-wrap.

**Rationale**:
- Aligns with constitution breakpoints (375px–1920px) and existing patterns
- Horizontal-scroll table pattern is already used in the domains table per constitution
- No layout inversion needed — all elements stack naturally

**Alternatives considered**:
- Card layout for results on mobile — more work for phase 8, inconsistent with constitution's domain table pattern (which uses scrollable table at 480-767px)

### 5. Shadcn/ui Component Selection

**Decision**: Use existing shadcn/ui components already in the project: `Textarea` (input), `ToggleGroup`/`Toggle` (resolver selector), `Table` (results), `Badge` (status), `Button` (resolve), `Tooltip` (copy confirmation).

**Rationale**:
- All components are already installed and themed for dark/light mode
- `ToggleGroup` provides accessible radio-group behavior for the resolver selector
- `Badge` variants (success/destructive/default) map to DNS statuses
- `Tooltip` provides instant feedback for IP copy without custom state management

**Alternatives considered**:
- Custom components — violates constitution's design system mandate
- Radio buttons for resolver selector — less polished than ToggleGroup

### 6. Clipboard API Fallback

**Decision**: Try `navigator.clipboard.writeText()`. If unavailable (HTTP context, older browser), show a brief tooltip text "Copied!" on successful write, silently fail with no error otherwise. No fallback execCommand approach.

**Rationale**:
- `navigator.clipboard` is supported in all modern browsers over HTTPS
- The app runs on Vercel with HTTPS by default
- `execCommand('copy')` is deprecated and requires a text selection workaround
- Non-critical feature — IP copy is a convenience, not a requirement for tool function

### 7. Route Placement

**Decision**: Place the page at `app/(dashboard)/dns-checker/page.tsx` following the existing dashboard routing group pattern (alongside domains, dashboard, sales, settings, import).

**Rationale**:
- The `(dashboard)` route group provides the shared dashboard layout (sidebar, header)
- Consistent with constitution's architecture pattern
- Plan.md Phase 8 suggests `app/(tools)/dns-checker/` but no `(tools)` group exists
