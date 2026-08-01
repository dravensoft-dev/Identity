Arena surface container, the hairline border on the base surface scale, with an
optional header. Standalone, `OnPush`, signal inputs. Styling is the sibling
`Card.variants.ts` recipe, read from `Card.manifest.json` in the shared Tailwind
layer; the component carries no CSS classes of its own. **The root slot is NOT host-bound**, and that is
forced rather than chosen: `click` is an output whose name is also a native DOM event, and Angular
installs both a DOM listener and an output subscription for such a name, so a host that both
listens and emits re-enters its own listener on every emission. The recipe lands on an inner
`<div>` that stops propagation, the shape `arena-side-nav-item` and `arena-table-row` already
take, and the host goes `display: contents`.

```html
<arena-card [eyebrow]="'Delivery'" [title]="'Client Portal'">
  <arena-badge action tone="success">Deployed</arena-badge>
  <p>Everything the client can see, in one place.</p>
</arena-card>

<arena-card floating>Just a surface, with no header block at all.</arena-card>

<arena-card interactive [title]="'checkout-api'" (click)="open(service)">Healthy, 14 replicas</arena-card>
```

**`interactive` makes the whole card one activation target**, which is the ordinary shape of a
list on a phone, and it is a declared boolean rather than "is `(click)` bound?" for R6's reason,
the same one `arena-table-row`'s `interactive` gives. Arena writes `role="button"`, a tab stop and
an Enter/Space handler, and draws the surface's own hover and focus states. Without it the card is
inert and adds no tab stop, because a dead stop on every card of every list is worse than the gap
it would close.

**An interactive card is a `role="button"` div and never a `<button>` element**, because a card
body is where a consumer puts their own controls and a control nested inside a control is
reachable by nobody. That is also why activation ignores a key pressed on something inside: Enter
typed into a field within the card must not open the card.

The `action` slot is an attribute selector, which is this layer's whole projection
convention: write `action` on the element that goes beside the title. With no
`title`, no `eyebrow` and nothing marked `action`, the header block does not
render, the card is a plain surface.

**Do / Don't**
- **Bind `title`, don't write it as a static attribute.** `<arena-card title="X">`
  leaves a real `title` attribute on the host, and the browser draws a tooltip over
  the whole card. `[title]="'X'"` does not. This is layer-wide rather than Card's
  own: Angular writes a static attribute during the creation pass whether or not it
  also matches an input. This host clears it (`'[attr.title]': 'null'`) and
  `test/HostClassBinding.test.ts` holds that layer-wide in both directions, so the
  binding above is the clearer spelling rather than a workaround.
- Depth comes from `floating`'s warm shadow and the `base-100`→`base-200`→`base-300`
  surface scale. Never a gradient.
- Reach for `accent` to mark one card among several as the current or featured one;
  it draws the border in the accent colour and nothing else. It is not a status.
- Don't write a `class` on `<arena-card>` expecting it to reach the card: the host is
  bare and out of layout, so an attribute written there lands on nothing anyone can
  see. That is the price of the carve-out above, and there is no second route in. To
  size, constrain or position a card, wrap it in your own element rather than
  reaching through it.
- Don't nest a card inside a card. The surface scale has three steps and a card is
  one of them; a card on a card reads as a mistake rather than as depth.

**By hand, in a real browser** (`bun run build:angular-demo && bun run demos`, then
`frameworks/angular/components/display/card/Card.card.html`):
- An interactive card takes the hover surface, and one Tab reaches it and shows the focus ring.
  Enter and Space both open it, and Space does not scroll the page underneath.
- The disabled card is still reached by Tab and still announces itself, and neither key nor
  pointer activates it.
- On the card holding a field, typing Enter in the field does not open the card, and the badge
  and the field keep their own presses.
- `floating` casts the warm shadow and the borderless variant does not, with no
  gradient on either.
- A long body wraps inside the padding rather than escaping the radius: the root
  clips with `overflow-hidden`, so a wide child is cropped rather than overflowing.
- With only an `action` and no title or eyebrow, the header still renders and the
  action sits right-aligned against an empty title block.
