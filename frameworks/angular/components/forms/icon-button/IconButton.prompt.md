Arena icon-only button, an action compact enough to carry no visible text, and an accessible
name in every state regardless. Standalone, `OnPush`, signal I/O. Styling is the sibling
`IconButton.variants.ts` recipe; the component carries no CSS classes of its own. The host stays
bare and out of layout: the recipe lands on a real `<button>` inside it, because the element
carrying the behaviour contract must be the element the browser already knows how to focus,
activate and disable.

```html
<arena-icon-button icon="ph-bold ph-trash" label="Delete project" (click)="confirmDelete()" />
<arena-icon-button icon="ph-bold ph-plus" label="New project" variant="solid" (click)="create()" />
<arena-icon-button icon="ph-bold ph-pencil-simple" label="Rename" size="sm" (click)="rename()" />
<arena-icon-button icon="ph-bold ph-download-simple" label="Export CSV" showLabel (click)="export()" />
<arena-icon-button icon="ph-bold ph-arrow-clockwise" label="Retry" disabled />
```

**Do / Don't**
- `label` is **required and is the accessible name**, not a decoration. It is the `aria-label` in
  every state, the visible text under `showLabel`, and the `title` when there is none. An icon
  button without it announces nothing at all, which is why this input has no default.
- `icon` is a Phosphor class-name string Arena draws inside an `aria-hidden` `<i>`, never a slot.
  That is the single-icon convention, and it is why this component projects nothing.
- The `title` is dropped the moment `showLabel` is set. A title beside a visible label makes the
  browser draw a tooltip repeating what is already on screen.
- Don't rely on the `title` alone on a touch or keyboard surface, because a title appears on pointer
  hover and nowhere else. Set `showLabel`, or reach for `arena-tooltip` on the trigger.
- `variant="solid"` fills with the brand and is for the one primary action in a dense toolbar.
  `ghost` is the default and the right answer nearly always; a row of solid icon buttons has no
  hierarchy left to spend.
- There is no `danger` variant, and that is the danger convention rather than an omission: a
  destructive action needs a word, so use `<arena-button variant="danger">`.
- `size` reads the same density tokens `arena-button` does, so the two re-densify together in a
  toolbar. Set the same `size` on both or they will not line up.
- Reach for `tabStop="false"` only inside a composite that manages its own focus (a grid with a
  roving tab stop, a menu) where reaching this control by Tab would be a second way in.
- Don't rely on click delegation from an ancestor. `click` is an output named after a native DOM
  event, and Angular then registers **both** the output subscription and a host DOM listener, so
  a consumer's `(click)` would fire twice on every press. The inner button calls
  `stopPropagation()` to make it fire once, which is the whole reason the event does not reach
  ancestors. Bind `(click)` on the `<arena-icon-button>` itself; `type="submit"` still submits,
  because the default action is untouched and only propagation is.

**By hand, in real Chromium**: none of these is provable in happy-dom. Run `bun run demos` and
open `/frameworks/angular/components/forms/icon-button/IconButton.card.html`:
- The focus ring is visible on keyboard focus for both variants, including `ghost`, whose
  background is transparent.
- Without `showLabel` the control is square at every size, and the glyph is optically centred
  rather than merely boxed in the middle.
- Hovering shows the `title`, and setting `showLabel` stops it appearing at all.
- `disabled` dims to 45% and the cursor turns to not-allowed; both come from `:disabled`
  variants, so they prove the native attribute is really set.
