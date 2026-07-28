# Contract: DomainInput

**Module**: `components/dns-checker/DomainInput.tsx`
**Exported as**: `DomainInput`

## Signature

```typescript
function DomainInput(props: {
  value: string;
  onChange: (value: string) => void;
  domainCount: number;
  error: string | null;
  isLoading: boolean;
}): JSX.Element
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `value` | `string` | Raw textarea content |
| `onChange` | `(value: string) => void` | Called on every textarea change |
| `domainCount` | `number` | Number of valid parsed domains (0 if not yet parsed) |
| `error` | `string \| null` | Parse error message (e.g. exceeds 200 limit) |
| `isLoading` | `boolean` | Whether resolution is in progress |

## Behavior

1. Renders a `Textarea` (shadcn/ui) with placeholder text inviting domain paste
2. Below the textarea, displays a live count: `"{domainCount} domains detected"` when count > 0, or `"Enter domain names..."` when count is 0
3. When `error` is not null: displays the error message in a red/warning-styled alert below the counter
4. Textarea height: minimum 6 rows, resizable (Tailwind `resize-y`)
5. Uses monospace font for domain display (JetBrains Mono per constitution typography)
6. Full width at all breakpoints

## States

| State | Visual |
|-------|--------|
| Empty | Placeholder text, counter shows 0 |
| With input | Live domain count updates as user types |
| Parse error | Red alert with error message, counter hidden |
| Loading | Textarea border muted or subtle pulse (no disable — user can edit during resolve) |

## Example

```tsx
<DomainInput
  value={rawInput}
  onChange={setRawInput}
  domainCount={parsedDomains.length}
  error={parseError}
  isLoading={isLoading}
/>
```
