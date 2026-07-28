# Contract: CompareToggle

**Module**: `components/dns-checker/CompareToggle.tsx`
**Exported as**: `CompareToggle`

## Signature

```typescript
function CompareToggle(props: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled: boolean;
}): JSX.Element
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `enabled` | `boolean` | Whether Compare Providers mode is currently active |
| `onChange` | `(enabled: boolean) => void` | Called when user toggles the checkbox |
| `disabled` | `boolean` | Disable the toggle (during active resolution) |

## Behavior

1. Renders a checkbox (shadcn/ui `Checkbox`) with label "Compare Providers" directly adjacent to the ResolverSelector
2. When checked: compare mode is active (resolver selector disabled, dual resolution runs)
3. When unchecked: single-resolver mode (resolver selector enabled)
4. Disabled state: checkbox is non-interactive during resolution (prevents mid-resolution mode switches)
5. Accessible via keyboard: Tab to focus, Space/Enter to toggle

## States

| State | Visual |
|-------|--------|
| Unchecked (default) | Checkbox off, label "Compare Providers", resolver selector active |
| Checked | Checkbox on, resolver selector greyed out, side-by-side table |
| Disabled | Checkbox greyed out, non-interactive |

## Placement

Rendered next to `ResolverSelector` in the page layout:

```tsx
<div className="flex items-center gap-4 flex-wrap">
  <ResolverSelector value={resolver} onChange={setResolver} disabled={isLoading || compareMode} />
  <CompareToggle enabled={compareMode} onChange={setCompareMode} disabled={isLoading} />
</div>
```
