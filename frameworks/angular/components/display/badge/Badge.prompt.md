Arena status label, mono, uppercase, short. Standalone, `OnPush`, signal input.
Styling is the sibling `Badge.variants.ts` recipe, read from `Badge.manifest.json`
in the shared Tailwind layer; the component carries no CSS classes of its own and
host-binds its root slot.

```html
<arena-badge tone="success" dot>Deployed</arena-badge>
<arena-badge tone="warning">In review</arena-badge>
<arena-badge>Draft</arena-badge>
```

**Tone taxonomy.** Two families, and they are not mixed:
- **Status**: `success` `warning` `danger` `info`: the actual state of the system
  (a deploy, a service, a version). `dot` reinforces "live status".
- **Emphasis**: `accent` (new/featured), `gold` (priority/distinction): editorial,
  and never a state. `neutral` carries no semantic weight.

**Do / Don't**
- Keep the label to one or two words. A badge is a chip, not a sentence, if it
  runs longer, it is not a badge.
- Don't use `accent` to communicate a status; reserve its crimson for
  "new/featured", and reach for a status tone when the badge reports state.
- Don't put `dot` on an emphasis tone. The dot means "this is live status", so on
  `accent` or `gold` it claims something the tone does not.
- Don't reach for a badge when the label can be dismissed or acted on: that is
  `arena-tag`, which owns `removable` and a real `<button>`. A badge has no
  interactive affordance at all, and its behaviour binding says so.
- Don't write a `class` or an ARIA attribute on `<arena-badge>` expecting it to
  reach the chip: the root slot is host-bound, so the host **is** the chip and a
  static `class` on it is overwritten by the recipe. Wrap it in your own element
  when you need to position it.

**By hand, in a real browser** (`bun run demos`, on any page composing it,
`arena-badge` has no demo page of its own because nothing about it needs one):
- Each of the seven tones reads as its own colour against `--surface-card`, and
  the mono uppercase treatment survives at the smallest text size.
- With `dot`, the dot takes the tone's own ink (`bg-current`) rather than a
  second colour.
