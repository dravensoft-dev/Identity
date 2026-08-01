Base container. Use `eyebrow` (crimson mono) + `title` (Archivo) for the header.

```tsx
<Card eyebrow="Delivery" title="Client Portal" action={<Badge tone="success">Deployed</Badge>}>
  …
</Card>

<Card interactive title="checkout-api" onClick={() => open(service)}>Healthy · 14 replicas</Card>
```

**`interactive` makes the whole card one activation target**, which is the ordinary shape of a
list on a phone, and it is a declared boolean rather than "is `onClick` bound?" for R6's reason,
the same one `TableRow.interactive` gives. Arena writes `role="button"`, a tab stop and an
Enter/Space handler, and draws the surface's own hover and focus states. Without it the card is
inert and adds no tab stop, because a dead stop on every card of every list is worse than the gap
it would close.

**An interactive card is a `role="button"` div and never a `<button>` element**, because a card
body is where you put your own controls and a control nested inside a control is reachable by
nobody. That is also why activation ignores a key pressed on something inside: typing Enter in a
field within the card must not open the card.

**Don't**
- Don't put an interactive card inside another activation target, and don't put your only route to something inside one: a card that is itself pressable makes a nested link ambiguous to a pointer and to a screen reader alike.
- Don't pass `style` or stray DOM attributes. Card declares its `content` and `action` slots plus `title`, `eyebrow`, `floating`, `accent`, `interactive` and `disabled`, and renders nothing else. To size, constrain or shadow a card differently, wrap it in your own element (a fixed-width `<div>`, a `maxWidth` box) rather than reaching through the card.