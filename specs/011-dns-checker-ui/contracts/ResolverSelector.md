# Contract: ResolverSelector

**Module**: `components/dns-checker/ResolverSelector.tsx`
**Exported as**: `ResolverSelector`

## Signature

```typescript
function ResolverSelector(props: {
  value: "cloudflare" | "google";
  onChange: (value: "cloudflare" | "google") => void;
  disabled: boolean;
}): JSX.Element
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `value` | `"cloudflare" \| "google"` | Currently selected resolver |
| `onChange` | `(value: "cloudflare" \| "google") => void` | Called when user selects a different resolver |
| `disabled` | `boolean` | Disables the control (during active resolution) |

## Behavior

1. Renders a `ToggleGroup` (shadcn/ui) with two `ToggleGroupItem` options: "Cloudflare" and "Google"
2. Single-select behavior (radio-group pattern)
3. "Cloudflare" is the default/initial selection
4. Disabled state: all toggle items are non-interactive, cursor shows `not-allowed`
5. During resolution (`disabled = true`): changing the resolver is blocked (per spec edge case)
6. Accessible via keyboard: Tab to focus, Arrow keys to switch

## States

| State | Visual |
|-------|--------|
| Default | "Cloudflare" selected, both options interactive |
| Google selected | "Google" selected, both options interactive |
| Disabled | Both options greyed out, non-interactive |

## Example

```tsx
<ResolverSelector
  value={resolver}
  onChange={setResolver}
  disabled={isLoading}
/>
```
