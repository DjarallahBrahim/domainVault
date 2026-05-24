# Quickstart: Phase 2 Refresh — Manual Domain Entry

**Audience**: Developers verifying the manual entry feature implementation.

## Prerequisites

- Phase 1 & Phase 2 fully implemented and functional
- At least one verified user account
- Optional: at least one existing domain in the portfolio (for empty-state testing)

## Verification Checklist

### 1. "Add Domain" Button Visibility

- [ ] **With existing domains**: Navigate to `/domains`. An "Add Domain" button is
  visible near the search/filter bar.
- [ ] **With zero domains**: Create a fresh account with no domains. Navigate to
  `/domains`. The empty state shows both "Import CSV" and "Add your first domain"
  options with distinct CTAs.

### 2. Open Manual Entry Dialog

- [ ] Click "Add Domain". A modal dialog opens overlaid on the domain list.
- [ ] The dialog contains fields for: domain name, expiration date, purchase price,
  registrar, notes, and tags.
- [ ] Press Escape — dialog closes, no domain created.
- [ ] Click outside the dialog — dialog closes, no domain created.
- [ ] Open dialog, fill in partial data, close — reopen — form is reset (no stale data).

### 3. Form Validation

- [ ] Submit with empty domain name → "Domain name is required" inline error.
- [ ] Submit with "nodot" → "Domain must contain a dot" inline error.
- [ ] Submit with "has space.com" → "Domain must not contain spaces" inline error.
- [ ] Submit with 254+ character domain → "Domain name exceeds 253 characters" inline error.
- [ ] Submit with empty expiration date → "Expiration date is required" inline error.
- [ ] Submit with negative purchase price → "Price must be non-negative" inline error.
- [ ] Valid purchase price (e.g., 12.99) → accepted.

### 4. Successful Entry

- [ ] Fill in a valid domain name (e.g., "new-domain.com"), expiration date, and
  optional fields.
- [ ] Click submit. Dialog closes. Toast appears: "Domain added".
- [ ] The new domain appears in the domain list with status "active".
- [ ] The domain's TLD is correctly auto-derived (e.g., "com" for "new-domain.com").
- [ ] The domain's tags are correctly parsed (e.g., "premium, brandable" → displayed
  as two tags).
- [ ] Navigate to the domain detail page — all fields match what was entered.

### 5. Duplicate Detection

- [ ] Open "Add Domain" dialog. Enter a domain name that already exists in the
  portfolio (case variation, e.g., "New-Domain.com" when "new-domain.com" exists).
- [ ] Submit. Inline error appears: "Domain already exists in your portfolio".
- [ ] Dialog stays open (form not cleared, so user can correct the domain name).

### 6. No Regressions

- [ ] CSV import still works: upload a CSV, verify import summary, domains appear.
- [ ] Domain search, filter, sort still work on the domain list.
- [ ] Domain edit (detail page) still works.
- [ ] Single domain delete still works.
- [ ] Bulk domain delete still works.
- [ ] Import history still shows past imports.
- [ ] Manual domains appear in dashboard analytics (Phase 3 counts).
- [ ] Manual domains can be sold via sales tracking (Phase 4).

### 7. Build & Lint

- [ ] `npm run typecheck` — zero TypeScript errors.
- [ ] `npm run lint` — zero ESLint warnings.
- [ ] `npm run build` — clean Vercel build, all routes compile.

## Files Changed

| File | Change | Purpose |
|---|---|---|
| `components/domains/domain-add-dialog.tsx` | **NEW** | Modal dialog with manual entry form |
| `components/domains/domain-list-client.tsx` | MODIFIED | Add "Add Domain" button + wire dialog |
| `components/domains/domain-empty-state.tsx` | MODIFIED | Add manual entry CTA |
| `lib/supabase/queries/domains-client.ts` | MODIFIED | Add `insertSingleDomain()` function |
| `lib/validations/domain.ts` | MODIFIED | Add `manualEntrySchema` |

## Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| "Domain already exists" on new domain | Case-insensitive match against existing domain | Use a different domain name or delete the existing one first |
| TLD shows wrong value | `split_part(domain, '.', -1)` is database-computed | Verify the domain name has correct TLD; multi-part TLDs (`.co.uk`) give only the last segment (known limitation) |
| Form doesn't close after submit | Toast error or network failure | Check browser console; Supabase connection issues surface via toast |
| Build fails with `next/headers` error | New code imports from `domains.ts` (server) instead of `domains-client.ts` | Ensure `domain-add-dialog.tsx` imports from `domains-client.ts` |
