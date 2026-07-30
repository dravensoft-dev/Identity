Arena surface container — the hairline border on the base surface scale, with an
optional header. Standalone, `OnPush`, signal inputs. Styling is the sibling
`Card.variants.ts` recipe, read from the same `Card.manifest.json` React's
Tailwind mirror reads; the component carries no CSS classes of its own and
host-binds its root slot.

```html
<arena-card [eyebrow]="'Delivery'" [title]="'Client Portal'">
  <arena-badge action tone="success">Deployed</arena-badge>
  <p>Everything the client can see, in one place.</p>
</arena-card>

<arena-card floating>Just a surface — no header block at all.</arena-card>
```

The `action` slot is an attribute selector, which is this layer's whole projection
convention: write `action` on the element that goes beside the title. With no
`title`, no `eyebrow` and nothing marked `action`, the header block does not
render — the card is a plain surface.

**Do / Don't**
- **Bind `title`, don't write it as a static attribute.** `<arena-card title="X">`
  leaves a real `title` attribute on the host, and the browser draws a tooltip over
  the whole card. `[title]="'X'"` does not. This is layer-wide rather than Card's
  own — `DOUBTS.md` names every primitive it reaches — and it is why the example
  above binds both strings.
- Depth comes from `floating`'s warm shadow and the `base-100`→`base-200`→`base-300`
  surface scale. Never a gradient.
- Reach for `accent` to mark one card among several as the current or featured one;
  it draws the border in the accent colour and nothing else. It is not a status.
- Don't write a `class` on `<arena-card>` expecting it to survive: the root slot is
  host-bound, so the recipe owns the host's class attribute. To size, constrain or
  position a card, wrap it in your own element rather than reaching through it.
- Don't nest a card inside a card. The surface scale has three steps and a card is
  one of them; a card on a card reads as a mistake rather than as depth.

**By hand, in a real browser** (`bun run demos`, on any page composing it —
`arena-card` has no demo page of its own because nothing about it needs one):
- `floating` casts the warm shadow and the borderless variant does not, with no
  gradient on either.
- A long body wraps inside the padding rather than escaping the radius: the root
  clips with `overflow-hidden`, so a wide child is cropped rather than overflowing.
- With only an `action` and no title or eyebrow, the header still renders and the
  action sits right-aligned against an empty title block.
