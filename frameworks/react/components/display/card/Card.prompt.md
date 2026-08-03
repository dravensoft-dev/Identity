Base container. Use `eyebrow` (crimson mono) + `title` (Archivo) for the header.

```tsx
<Card eyebrow="Delivery" title="Client Portal" action={<Badge tone="success">Deployed</Badge>}>
  …
</Card>

<Card interactive title="checkout-api" onClick={() => open(service)}>Healthy · 14 replicas</Card>
```

<!-- @api GENERATED from contracts/api/components/Card.json. Edit the contract, not this table. -->

**Members**, in contract order and under this layer's own names. `*` marks a required one.

| Member | Form | Type | Default | What it is |
|---|---|---|---|---|
| `children` | slot |  |  | The card's body, below the optional header. |
| `interactive` | primitive | `boolean` | `false` | Whether the whole card is one activation target, which is the ordinary shape of a list on a phone. A boolean rather than "is `click` bound?" -- R6, the same reason TableRow.interactive is one. An interactive card is a role="button" tab stop with an Enter/Space handler and the surface's own hover and focus states; a non-interactive one is inert and adds no tab stop, because a dead stop on every card of every list is worse than the gap it would close. It is a ROLE rather than a <button> element for the same reason TableRow's card shape is: a card body may hold controls of its own, and a control inside a control is reachable by nobody. |
| `disabled` | primitive | `boolean` | `false` | Whether an interactive card is drawn but cannot be activated. It reflects through aria-disabled rather than any native attribute, and the card stays in the tab order rather than leaving it, because a disabled control nobody can reach is a control nobody knows exists. Without `interactive` there is nothing to disable and the card is inert already. |
| `href` | primitive | `string` |  | Present => the card renders an <a>; absent, with `interactive`, a role="button". The same split, and the same reason, as SideNavItem.href: a control that navigates must be a link, openable in a new tab, address copyable, announced as a link, and none of that can be rebuilt on a div. A primary click with no modifier is cancelled and reported through `click`, so a router owns it; ctrl, meta, shift, alt, a middle click and a context menu stay the browser's and report nothing. It implies interaction on its own, so `interactive` is not also required, and with `disabled` it refuses activation through aria-disabled the way an item does. The card's own content still holds whatever controls it holds; a control inside the anchor is a control inside a link, which is the price of making the whole surface the target and the reason `interactive` exists as the alternative. |
| `action` | slot |  |  | Right-aligned in the header, beside the title. Arena draws the header row; the consumer draws what sits in it. |
| `title` | primitive | `string` |  | Header title. Absent, along with eyebrow and action, renders no header block at all. |
| `eyebrow` | primitive | `string` |  | Mono uppercase label above the title, in the accent colour. |
| `floating` | primitive | `boolean` | `false` | Adds the warm shadow. Depth comes from the shadow and the surface scale, never a gradient. |
| `accent` | primitive | `boolean` | `false` | Draws the border in the accent colour instead of the surface hairline. |
| `onClick` | event |  |  | An interactive card was activated, by pointer or by Enter or Space. With `href` it is also how the card reports the one activation a router owns, a primary click or Enter with no modifier, and Arena has already cancelled the anchor's own navigation by the time it fires; a modified or middle click is the browser's and does not fire it at all. No payload, because the consumer wrote this element and already holds what it is about. |

<!-- @api end -->

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

### A card that navigates

`href` makes the whole card a real `<a>`: openable in a new tab, address copyable, announced
as a link. It is the same split, and the same reason, as `SideNavItem`'s own `href`, and it
implies interaction on its own, so `interactive` is not also needed. With `disabled` it
refuses activation through `aria-disabled` and prevents the anchor's default.

```tsx
<Card href="/clients/acme" title="Acme Corp" onClick={() => navigate('/clients/acme')}>
  <p>Everything the client can see.</p>
</Card>
```

**`href` reports its plain activation through `onClick`**, so your router's navigate in that
handler is the whole bridge and the page does not reload. The modified clicks stay the
browser's and fire nothing, which is why the member is worth having over `interactive`. Bind
nothing and the card is a plain link that navigates the document.

**Don't wrap a `Card` in your router's `Link`.** That nests an anchor inside an anchor, which
is invalid and reachable by nobody. Give the card the `href` and route in `onClick`.

Choose between the two by what the press DOES. A card that goes somewhere is `href`; a card
that changes local state is `interactive` with `onClick`. And a card whose body holds controls
of its own is `interactive`, not `href`: the anchor wraps the whole surface, so a button inside
it is a control inside a link, which is exactly the nesting `interactive` was made a
`role="button"` div to avoid.
