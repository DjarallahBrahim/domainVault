# Contract: useDnsChecker

**Module**: `lib/hooks/useDnsChecker.ts`
**Exported as**: `useDnsChecker`

## Signature

```typescript
function useDnsChecker(): {
  rawInput: string;
  setRawInput: (value: string) => void;
  parsedDomains: string[];
  parseError: string | null;
  resolver: Resolver;
  setResolver: (r: Resolver) => void;
  results: (DnsResult | null)[];
  isLoading: boolean;
  filter: "all" | "dns_ok" | "no_dns";
  setFilter: (f: "all" | "dns_ok" | "no_dns") => void;
  filteredResults: (DnsResult | null)[];
  counts: { all: number; dns_ok: number; no_dns: number };
  progress: { done: number; total: number };
  canResolve: boolean;
  resolveAll: () => void;
}
```

## State Management

- `rawInput` / `setRawInput`: Raw textarea content
- `parsedDomains`: Derived from `rawInput` via debounced `parseDomainList()` (debounce: 300ms)
- `parseError`: Set when `parseDomainList()` returns an error (e.g. exceeds 200 domains)
- `resolver` / `setResolver`: Currently selected DNS provider
- `results`: Array of resolved `DnsResult`, indexed by `parsedDomains` order. `null` entries represent pending/unresolved domains
- `isLoading`: `true` while a resolution batch is in progress
- `filter` / `setFilter`: Active filter pill
- `filteredResults`: `results` filtered by current `filter` value
- `counts`: Live counts of `ok`, `no_dns`, and total resolved results
- `progress`: `{ done, total }` for progress indicator
- `canResolve`: `parsedDomains.length > 0 && !isLoading && !parseError`

## Behavior

### Parsing (debounced)
- On every `rawInput` change, debounce 300ms then call `parseDomainList(rawInput)`
- On success: set `parsedDomains`, clear `parseError`
- On error: set `parseError`, clear `parsedDomains`

### Resolution (`resolveAll()`)
- Guard: If `isLoading` or `!canResolve`, return immediately (no-op)
- Sets `isLoading = true`
- Creates a new `AbortController`, stores it in a ref
- Initializes `results` array of `null` entries matching `parsedDomains.length`
- Creates a concurrency pool (cap: 20) calling `resolveDomain(parsedDomains[i], resolver, controller.signal)` for each domain
- As each promise resolves: update `results[i]` with the result, increment `progress.done`
- When all complete OR abort fires: set `isLoading = false`
- AbortController is aborted on unmount (cleanup in `useEffect` return)

### Concurrent Prevention
- The resolve button and keyboard shortcut check `isLoading` before calling `resolveAll()`
- `resolveAll()` itself also guards on `isLoading`

### Keyboard Shortcut
- `useEffect` registers a `keydown` listener on `window`
- On `Ctrl+Enter` (Windows/Linux) or `Meta+Enter` (Mac), calls `resolveAll()`
- Short-circuits if `isLoading`
- Listener removed on unmount

### Cleanup on Unmount
- `useEffect` return aborts the stored `AbortController` ref
- This cancels all in-flight `resolveDomain` calls

## Interface Dependency

```typescript
import { resolveDomain, type Resolver, type DnsResult } from "@/lib/dns/resolve";
import { parseDomainList } from "@/lib/dns/parseInput";
```

## Example Usage

```tsx
const {
  rawInput, setRawInput,
  parsedDomains, parseError,
  resolver, setResolver,
  results, isLoading,
  filter, setFilter,
  filteredResults, counts, progress,
  canResolve, resolveAll
} = useDnsChecker();
```
