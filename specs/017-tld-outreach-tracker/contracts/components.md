# Component Contracts: Promoting (TLD Outreach Tracker)

**Date**: 2026-08-19 | **Feature**: Phase 23

## PromotingPage

Page shell + state orchestration. Reads `?domain=` on mount, owns `selectedDomainId`, renders the layout, and wires all child components.

```tsx
// Reads: useSearchParams → initial domainId
// Writes: router.replace(`/promoting?domain=${id}`) on picker change
<PromotingPage />

// Renders:
// - title "Promoting" + <DomainPicker value onChange />
// - <PromotingSummaryCards domainId />   (only when domainId set)
// - <ReservedTldTable domainId />        (desktop ≥md)
// - <ReservedTldCardRow domainId />      (mobile <md)
// - <RunTldCheckPrompt />                (empty-state, replaces table)
```

**Behavior**:
- No domain selected → prompt "select a domain", no cards/table.
- Empty portfolio → picker shows placeholder: "No domains yet — add one from Import".

---

## DomainPicker

Searchable combobox built from shadcn `Command` + `Popover`. Options from `usePromotingDomains()`.

```tsx
<DomainPicker
  value={selectedDomainId}
  onChange={(id: string) => ...}
/>
```

**Behavior**:
- Each option renders domain name (JetBrains Mono) + muted badge with `reserved_tlds_count` or "not checked" when `null`.
- Selecting → `onChange`; parent syncs `?domain=` param via `router.replace`.
- Empty portfolio → placeholder text inside the popover.

---

## PromotingSummaryCards

Three KPI-style cards, same visual spec as US-013 (icon, accent stripe, animated counter, hover lift, skeleton while loading). Not clickable in v1.

```tsx
<PromotingSummaryCards domainId={selectedDomainId} />

// 1. Reserved TLDs   — total, accent-primary
// 2. Contacted       — count contacted=true, accent-warning
// 3. Positive Replies— count positive, accent-success; subtext "N negative" (accent-danger)
```

**Data source**: derived from the merged `useReservedTlds` + `useTldOutreach` rows for the domain.

---

## ReservedTldTable

Desktop table (`<Table>`), rendered ≥ `md` breakpoint. Columns: TLD · Contacted · Reply.

```tsx
<ReservedTldTable
  tlds={reservedTlds}
  outreach={outreachMap}
  onToggleContacted={toggleContacted}
  onSetReply={setReplyStatus}
/>
```

**Behavior**:
- TLD cell: `fullDomain` in JetBrains Mono, accent-primary external link (`<a target="_blank" rel="noopener noreferrer">`), plus green/gray `isLive` dot.
- Contacted cell: shadcn `Checkbox`; hover tooltip "Contacted just now" via `contacted_at`.
- Reply cell: `ReplyStatusSelect`.
- Sortable by TLD (default) and by Reply (positive first) via column-header click.
- Loading: 5 skeleton rows. Refetch: keeps previous data (`keepPreviousData`) — no flash.

---

## ReservedTldCardRow

Mobile (< `md`) stacked-card layout, same data + handlers as the table.

```tsx
<ReservedTldCardRow
  tlds={reservedTlds}
  outreach={outreachMap}
  onToggleContacted={toggleContacted}
  onSetReply={setReplyStatus}
/>
```

**Behavior**:
- One card per TLD: full-domain link + live dot, contacted checkbox, reply pill, all in a vertical stack.
- No logic duplication — reuses the same merged rows and mutation callbacks.

---

## ReplyStatusSelect

shadcn `Select` styled as a status pill.

```tsx
<ReplyStatusSelect
  value={replyStatus}
  disabled={!contacted}
  onChange={onSetReply}
/>
```

**Behavior**:
- Options: Pending / Positive / Negative.
- Disabled (grayed) with tooltip "Mark as contacted first" while `contacted === false`.
- Pill tint: Pending neutral, Positive success-tint, Negative danger-tint; smooth color transition.
- `onChange` fires `setReplyStatus(tld, status)`.

---

## RunTldCheckPrompt

Empty-state panel shown instead of the table when `neverChecked` or `isEmpty`.

```tsx
<RunTldCheckPrompt
  domainName={selectedDomain.domain}
  variant={"neverChecked" | "isEmpty"}
  activeTldCount={activeTlds.length}
  onRun={() => POST /api/tld-checker/domains/:id/refresh}
/>
```

**Behavior**:
- `neverChecked`: "No TLD data yet for `word.com`" + "Run TLD Check" button.
- `isEmpty`: "No reserved TLDs found for `word.com` — checked `X` extensions." + "Re-check" button.
- Running: spinner + disabled button.
- Success: invalidate `['promoting','reserved-tlds', id]` + `['promoting','domains']` → table replaces prompt.
- `activeTldCount === 0`: button disabled + tooltip "No TLD list configured yet."

---

## Types (`types/promoting.ts`)

```ts
export interface PromotingDomainOption {
  id: string;
  domain: string;
  reserved_tlds_count: number | null;
  tlds_last_checked_at: string | null;
}

export interface ReservedTld {
  tld: string;
  fullDomain: string;
  isLive: boolean;
}

export type ReplyStatus = "pending" | "positive" | "negative";

export interface OutreachRow {
  contacted: boolean;
  contacted_at: string | null;
  reply_status: ReplyStatus;
  reply_at: string | null;
}
```

## Hooks

```ts
// usePromotingDomains — key ['promoting','domains']
// selects id, domain, reserved_tlds_count, tlds_last_checked_at from domains (browser client)

// useReservedTlds(domainId) — key ['promoting','reserved-tlds', domainId]
// calls GET /api/tld-checker/domains/:id/extensions → { tld, fullDomain, isLive }[]
// exposes { tlds, isLoading, isEmpty, neverChecked }

// useTldOutreach(domainId) — key ['promoting','outreach', domainId]
// reads tld_outreach rows → Map<tld, OutreachRow>; missing ⇒ { contacted:false, reply_status:'pending' }
// toggleContacted(tld, next)  → optimistic upsert (sets/clears contacted_at)
// setReplyStatus(tld, status) → optimistic upsert (sets reply_at when leaving 'pending')
// both invalidate outreach + promoting domains keys; rollback + error toast on failure
```

## Migration 009 (reference)

```sql
CREATE TABLE IF NOT EXISTS public.tld_outreach (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  domain_id      UUID REFERENCES public.domains(id) ON DELETE CASCADE NOT NULL,
  tld            TEXT NOT NULL,
  full_domain    TEXT NOT NULL,
  contacted      BOOLEAN NOT NULL DEFAULT false,
  contacted_at   TIMESTAMPTZ,
  reply_status   TEXT NOT NULL DEFAULT 'pending'
                 CHECK (reply_status IN ('pending', 'positive', 'negative')),
  reply_at       TIMESTAMPTZ,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (domain_id, tld)
);
CREATE INDEX idx_tld_outreach_user_id   ON public.tld_outreach(user_id);
CREATE INDEX idx_tld_outreach_domain_id ON public.tld_outreach(domain_id);
CREATE INDEX idx_tld_outreach_reply     ON public.tld_outreach(reply_status);
ALTER TABLE public.tld_outreach ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tld_outreach" ON public.tld_outreach
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```