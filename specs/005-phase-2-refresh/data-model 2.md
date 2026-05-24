# Data Model: Phase 2 Refresh — Full v2 Alignment

**Date**: 2026-05-24

## Overview

No new database entities. This document defines updated form schemas, query
functions, and UI data models for the new/updated features.

## Entities

### Domain (Existing — No Changes)

The `public.domains` table is unchanged. All new features work with existing columns.

## Form Schemas

### `manualEntrySchema` (Existing — Reused)

Already defined in `lib/validations/domain.ts`. Used by both the slide-over panel
(US-010) and the Import page manual entry tab (US-030). No changes needed.

### `domainEditSchema` (Existing — Reused)

Already defined. Used by the slide-over panel in edit mode. No changes needed.

## New Query Functions

### `fetchRegistrarList()`

```typescript
// Added to lib/supabase/queries/domains-client.ts

export async function fetchRegistrarList(): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("domains")
    .select("registrar")
    .not("registrar", "is", null)
    .order("registrar");

  if (error) throw error;

  const registrars = new Set<string>();
  for (const row of (data ?? []) as unknown as Array<{ registrar: string }>) {
    if (row.registrar.trim()) registrars.add(row.registrar.trim());
  }
  return Array.from(registrars);
}
```

### Multi-Domain Search (In `fetchDomains`)

The existing `fetchDomains()` in `domains-client.ts` is extended to support
comma-separated search tokens:

```typescript
if (filters.search) {
  const tokens = filters.search.split(",").map(t => t.trim()).filter(Boolean);
  if (tokens.length > 1) {
    query = query.or(tokens.map(t => `domain.ilike.%${t}%`).join(","));
  } else if (tokens.length === 1) {
    query = query.ilike("domain", `%${tokens[0]}%`);
  }
}
```

### Expiry Window Filter (In `fetchDomains`)

Added `expiry` filter parameter:

```typescript
if (filters.expiry === "1m") query = query.lte("expiration_date", addMonths(now, 1));
if (filters.expiry === "3m") query = query.lte("expiration_date", addMonths(now, 3));
if (filters.expiry === "6m") query = query.lte("expiration_date", addMonths(now, 6));
if (filters.expiry === "9m") query = query.lte("expiration_date", addMonths(now, 9));
```

### Registrar Multi-Filter (In `fetchDomains`)

Added `registrars` comma-separated filter:

```typescript
if (filters.registrars) {
  const registrars = filters.registrars.split(",").map(r => r.trim()).filter(Boolean);
  if (registrars.length > 1) {
    query = query.in("registrar", registrars);
  } else if (registrars.length === 1) {
    query = query.eq("registrar", registrars[0]);
  }
}
```

## UI Component Props

### `<DomainAddSlideover />`

```typescript
interface DomainAddSlideoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domain?: DomainRow; // undefined = add mode, defined = edit mode
}

// Internal state:
// - RHF form with manualEntrySchema (add) or domainEditSchema (edit)
// - useMutation for insert/update
// - Registrar autocomplete data from fetchRegistrarList()
// - Tag chip array state
```

### `<TagInput />`

```typescript
interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

// Behavior:
// - Enter or comma key splits current input into a new chip
// - Backspace on empty input removes last chip
// - X button on chip removes that chip
// - Chips rendered as styled spans below the input
```

### `<ManualEntryTab />`

```typescript
interface ManualEntryTabProps {
  // Self-contained; fetches registrar list internally
}

// Internal state:
// - RHF form with manualEntrySchema
// - useMutation for insertSingleDomain
// - Success/error state for inline messaging
// - Form reset on success
```

## URL Query Parameters

Extended set of filter parameters serialized to URL:

| Param | Values | Example |
|---|---|---|
| `search` | string | `google.com,%20amazon.com` |
| `status` | comma-separated statuses | `active,sold` |
| `tld` | string | `com` |
| `registrar` | comma-separated registrar names | `GoDaddy,Namecheap` |
| `expiry` | `1m` / `3m` / `6m` / `9m` | `3m` |
| `sort` | `domain` / `expiration_date` / `status` | `domain` |
| `order` | `asc` / `desc` | `asc` |
| `page` | number | `1` |
| `pageSize` | `25` / `50` / `100` | `50` |

## State Transitions

### Slide-Over Panel

```
[Closed] → user clicks "Add Domain" → [Open (add mode)]
         → user clicks edit button → [Open (edit mode, pre-populated)]

[Open] → user fills fields → [Validate on blur (domain)] → [Validate on submit (Zod)] →
  ├─ Fail → [Inline errors; panel stays open]
  └─ Pass → [Mutation] →
       ├─ Error → [Toast error; panel stays open]
       └─ Success → [Toast success] → [Cache invalidate] → [Close panel]
```

### Import Page Tabs

```
[CSV Upload tab (default)] ↔ [Add Manually tab]

Add Manually:
[Form ready] → user fills → submit →
  ├─ Fail → [Inline error; form retains data]
  └─ Success → [Inline success message] → [Form resets empty]
```
