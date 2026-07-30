# Component API Contracts: TLD Reservation Checker

**Date**: 2026-07-30 | **Feature**: TLD Reservation Checker

## Phase 14 Components

### DomainInput

```ts
interface DomainInputProps {
  value: string;
  onChange: (value: string) => void;
  wordCount: number;
  error: string | null;
  disabled: boolean;
}
```

- Renders a `<textarea>` with monospace font, borderless styling inside the editor window
- Shows `// WORDS` section label above
- Below textarea: `↳ {wordCount} word(s)` helper text (or `↳ no words entered` if empty)
- Error state: shows error message in `text-accent-danger`
- Disabled state: dimmed, non-interactive (during active lookup per FR-009a)

### TldPicker

```ts
interface TldPickerProps {
  selectedTlds: string[];
  onToggleTld: (tld: string) => void;
  onAddCustomTld: (tld: string) => void;
  disabled: boolean;
}
```

- Renders default TLD chips (.com, .net, .org, .io, .ai, .co, .app, .dev) as toggleable pills
- Selected: filled style using `bg-accent-primary/10 border-accent-primary text-accent-primary`
- Deselected: outline style using `border-border text-muted-foreground`
- Custom TLD input: inline text field at end of chip row. On Enter, sanitizes and adds to selected set
- Shows `// TLDS` section label above
- Disabled state: all chips non-interactive (during active lookup)

### ResultsTable

```ts
interface ResultsTableProps {
  results: TldCheckResult[];
  filter: StatusFilter;
  onFilterChange?: (filter: StatusFilter) => void;
  isLoading: boolean;
}
```

- Columns: Status icon, Domain (clickable link), Status label, Response time
- Status icons: `CheckCircle` for available (green), `Globe` for registered (amber), `AlertCircle` for error (red)
- Skeleton rows when `isLoading` and results are empty
- Domain column: `<a href="https://{domain}" target="_blank">` with `ExternalLink` icon
- Empty state (after resolve with no results): "Enter words and select TLDs to check availability"
- Responsive: horizontal scroll on mobile

## Phase 15 Components

### StatCards

```ts
interface StatCardsProps {
  counts: TldCounts;
  filter: StatusFilter;
  onFilterChange: (filter: StatusFilter) => void;
}
```

- 4 cards in a responsive grid: Total (accent-primary ring), Available (accent-success ring), Registered (accent-warning ring), Error (accent-danger ring)
- Clicking a card sets the filter to that status
- Active card has elevated ring/border
- Shows `// STATS` section label above

### FilterPills

```ts
interface FilterPillsProps {
  filter: StatusFilter;
  onFilterChange: (filter: StatusFilter) => void;
  counts: TldCounts;
}
```

- Horizontal row of pills: All ({total}), Available ({count}), Registered ({count}), Error ({count})
- Active pill: filled style
- Inactive pills: outline style
- Reports `all` → `"All ({n})"` etc.

### ExportButton

```ts
interface ExportButtonProps {
  buildCsv: () => string;
  disabled: boolean;
}
```

- "Copy CSV" button with `<Copy>` icon
- On click: copies CSV to clipboard via `navigator.clipboard.writeText()`
- Fallback: Blob download if clipboard unavailable
- Shows `<Check>` icon + "copied" feedback for 1.5s after copy
- Disabled when `disabled` or no results

### HelpSection

```ts
// No props — fully self-contained
```

- Collapsible with `// how to use this tool` trigger
- Content: input formats, TLD selection, status meanings, FAQ (privacy, rate limits, why some lookups fail)
- FAQ question: "Why do some registrars show a domain as available when this tool says Registered?" → explain NS caching and stale DNS
- FAQ question: "What about premium/reserved domains?" → explain NS-based limitation

## Page Component

### TldCheckerPage

```ts
// No props — uses useTldChecker hook internally
```

Layout structure (matching DNS Checker page):

```
<div className="space-y-6">
  <h1>TLD Checker</h1> + subtitle
  <HelpSection />
  <div className="rounded-xl border border-border bg-bg-surface overflow-hidden">
    <TitleBar />  {/* traffic-light dots + query.tld label */}
    <div className="p-5 space-y-6">
      // WORDS
      <DomainInput />
      // TLDS
      <TldPicker />
      // CONTROLS
      <div>
        <ExportButton />
        <Button>Check Availability</Button>
      </div>
    </div>
  </div>
  // STATS (conditional)
  <StatCards />
  // RESULTS (conditional)
  <div>
    <FilterPills />
    <ResultsTable />
  </div>
</div>
```

## Hook Contract

### useTldChecker

```ts
function useTldChecker(): {
  // Input
  rawInput: string;
  setRawInput: (v: string) => void;
  parsedWords: string[];
  parseError: string | null;

  // TLD selection
  selectedTlds: string[];
  toggleTld: (tld: string) => void;
  addCustomTld: (tld: string) => void;

  // Resolution
  isLoading: boolean;
  results: TldCheckResult[];
  progress: { done: number; total: number };
  canCheck: boolean;
  checkAll: () => void;

  // Filtering
  filter: StatusFilter;
  setFilter: (f: StatusFilter) => void;
  filteredResults: TldCheckResult[];
  counts: TldCounts;

  // Export
  buildCsv: () => string;
}
```

**Implementation notes**:
- `parsedWords` derived from `rawInput` via `parseBaseWords()` on each keystroke
- `selectedTlds` initialized from `sessionStorage` with defaults fallback
- `checkAll()` builds all (word × tld) combinations, calls `checkAvailabilityBatch()`
- `filteredResults` = `results.filter()` based on `filter` state
- `buildCsv()` serializes `filteredResults` to CSV string
- Abort handling via `useRef<AbortController>` — cancel button + cleanup on unmount
- Analytics: `tld_check_run` event on `checkAll()` with `{ wordCount, tldCount, totalCombinations }`
