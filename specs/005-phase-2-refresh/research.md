# Research: Phase 2 Refresh — Full v2 Alignment

**Date**: 2026-05-24

## Decisions

### 1. Slide-Over Panel Implementation

**Decision**: Use shadcn/ui `<Sheet>` component (already installed) for the domain
add/edit slide-over panel. Sheet opens from the right side (`side="right"`). Form
content rendered inside `<SheetContent>`. Open/close via state in `domain-list-client.tsx`.

**Rationale**: Sheet is already in the project (`components/ui/sheet.tsx`). It provides
a slide-over from any direction with backdrop overlay (fixes the z-index/transparency
issue). Same pattern as the existing Dialog-based delete confirmation.

**Alternatives considered**:
- Custom slide-over with CSS transform — more work, worse accessibility (no focus trap,
  no ESC-to-close), inconsistent with shadcn/ui primitives.
- Keep the Dialog — violates master plan US-010 requirement for a slide-over panel.

### 2. Tag Chip Input

**Decision**: Build a custom `<TagInput>` component using controlled state. Renders
an `<Input>` that captures comma or Enter as tag separators. Tags shown as removable
chips (styled badges with X icon) below the input. Exposes value as `string[]` for
React Hook Form integration.

**Rationale**: No external chip-input dependency needed. The tag format in the database
is `TEXT[]`, so the component surfaces an array naturally. Pattern: `useState<string[]>` +
`onKeyDown` handler for Enter/comma. Removable chips via `.filter()` + `onClick` on X.

**Alternatives considered**:
- shadcn/ui Command with multi-select — no built-in chip input support; overkill.
- react-tag-input or similar npm package — adds dependency for a 30-line component.

### 3. Registrar Autocomplete

**Decision**: Add `fetchRegistrarList()` to `domains-client.ts` that queries distinct
registrar values from the user's domains. Use a combobox/datalist pattern — show
matching options as user types. Matching via `ilike("registrar", "%pattern%")`.

**Rationale**: Reuses existing Supabase query pattern; simple distinct-query with
client-side filtering for responsiveness. The autocomplete values come from the user's
own portfolio (RLS-enforced), so no security concern.

**Alternatives considered**:
- Pre-fetch all registrars on mount — simpler but wasteful for large portfolios;
  client-side filter of pre-fetched list is fine for <1000 distinct values.
- Native `<datalist>` HTML element — limited styling control; inconsistent cross-browser.

### 4. Enter-Key Search Mode

**Decision**: Change `domain-search.tsx` from debounced `onChange` to `onKeyDown`
(Enter) trigger. Maintain a local state for the search input value; only update the
URL search param (which triggers the query) when Enter is pressed or search button
clicked. The existing debounce is removed.

**Rationale**: Master plan US-009 explicitly requires Enter-key only trigger. This
also reduces Supabase query volume significantly — one query per explicit search
instead of one per keystroke.

**Alternatives considered**:
- Keep debounce but increase delay — doesn't satisfy the explicit requirement.
- Add toggle between real-time and Enter modes — over-engineered; master plan is clear.

### 5. Multi-Domain Search (OR-logic)

**Decision**: Parse the search input by comma separation, trim each token, and build
multiple `.ilike()` conditions joined by `.or()`. The Supabase JS client supports
`.or()` chaining. Each token is matched against `domain` column case-insensitively.

```typescript
// Pseudo
const tokens = search.split(",").map(t => t.trim()).filter(Boolean);
query = query.or(tokens.map(t => `domain.ilike.%${t}%`).join(","));
```

**Rationale**: Supabase JS client `.or()` supports comma-separated filter strings.
This is a single query (not N queries) and respects RLS. Tokens are OR-matched:
a domain matching ANY token appears in results.

**Alternatives considered**:
- Client-side filtering after fetching all domains — doesn't scale past ~500 domains;
  pagination breaks.
- Separate queries per token — N+1 problem; slow for many tokens.

### 6. CSV Export

**Decision**: Client-side Blob download. Read current filter/sort state from URL
search params, call `fetchDomains()` with a large page size (or fetch all filtered),
convert to CSV using string building (domain, tld, registrar, expiration_date,
purchase_price, status), trigger download via `<a>` click with Blob URL.

**Rationale**: No server endpoint needed. The user's domain data is already loaded
client-side via TanStack Query. Export respects current filters. PapaParse
`unparse()` could also be used but isn't needed for a simple column header + rows.

**Alternatives considered**:
- Server-side CSV generation via API route — unnecessary complexity; RLS already
  enforces data scoping.
- PapaParse `unparse()` — suitable but adds overhead for a straightforward
  comma-separated output.

### 7. Filter State Serialization to URL

**Decision**: Extend the existing pattern in `domain-search.tsx` that already
serializes status/tld/sort to URL search params. Add: `expiry` (1m/3m/6m/9m/all),
`registrar` (comma-separated for multi-select), multi-status. Use the existing
`useSearchParams` + `useRouter` hook pattern.

**Rationale**: The foundation is already in place — status and TLD filters sync to
URL params. Expanding to expiry window, registrar multi-select, and status
multi-select follows the same pattern. URL params enable deep-linking from dashboard
chart navigation.

### 8. Import Page Tabs

**Decision**: Simple state toggle (`activeTab`) in the Import page client component.
Render "CSV Upload" or "Add Manually" content based on `activeTab`. Style tabs as
buttons with active/inactive visual states. No shadcn/ui Tabs component needed.

**Rationale**: Two tabs is simple enough that a full `<Tabs>` component adds
unnecessary abstraction. A `useState<"csv" | "manual">` with conditional rendering
is sufficient and keeps the component tree flat.

### 9. CSV Column Reference Banner

**Decision**: Static informational banner component rendered at the top of the
CSV Upload tab. Copy-to-clipboard via `navigator.clipboard.writeText()`. Sample CSV
download via client-side Blob creation with hardcoded example data.

**Rationale**: The banner content is static (column names don't change). Copy uses
the Clipboard API (available in all modern browsers). Sample file is tiny (~100 bytes),
easily generated client-side.
