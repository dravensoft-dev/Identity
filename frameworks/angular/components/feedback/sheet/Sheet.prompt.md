Arena sheet, a working surface anchored to one edge of the page and kept open beside it rather than
over it: a cart, a filter drawer, a detail pane. Standalone, `OnPush`, signal I/O. Styling is the
sibling `Sheet.variants.ts` recipe; the component carries no CSS classes of its own, and the host
**is** the panel, so `<arena-sheet>` is the element you place.

It carries no scrim, traps no focus and takes nothing away from the page behind it. **When a panel
is meant to take the whole interaction until it is answered, that is `arena-dialog`**, two stacking
slots higher, and the scrim is how it says so.

```html
<arena-sheet [open]="cartOpen()" placement="end" title="Cart"
             [collapsed]="folded()" (collapsedChange)="folded.set($event)"
             dismissible (close)="cartOpen.set(false)">
  @for (line of lines(); track line.id) {
    <app-cart-line [line]="line" />
  }
  <div footer>
    <arena-button (click)="checkout()">Checkout</arena-button>
  </div>
</arena-sheet>
```

**Closed and collapsed are two different states, and both exist.** `open` decides whether the panel
is on the page at all; `collapsed` folds the body away and leaves the header and the footer where
they were. That is what the pattern buys: a reader can put the cart out of the way and still see
what it is and still check out, without losing it. The body is hidden rather than removed, so the
fold control's `aria-controls` never points at nothing.

`title` is required and **guarded at runtime**: a blank one throws rather than rendering a nameless
panel. It heads the panel and it is also the accessible name of the fold control, so a screen-reader
user hears "Cart, collapse" rather than "Toggle". Nothing can derive it, because what the panel is
showing is editorial.

`dismissible` gates the ×. It exists because Angular cannot ask whether an output has subscribers,
so the host says whether the panel is closeable rather than have Arena infer it from a `close`
listener. **Escape reports through that same `close`**, which is why answering it costs no member.
It reaches the panel only while focus is inside it: nothing here took focus in the first place, and
a panel that swallowed Escape from across the page would break a dialog open somewhere else.

**Do / Don't**
- **Do** own both booleans. Neither folds nor closes itself, so a template that ignores
  `collapsedChange` gets a caret that turns and a body that does not move.
- **Do** put the one action the panel exists for in the `footer` slot. It sits outside the folding
  body, so a folded panel still carries it.
- **Don't** reach for it as a menu or a popover. It spans a whole edge and stays; `arena-menu` is
  the transient list that hangs off a trigger.
- **Don't** open two at once on the same edge. They share a stacking slot and one lands on the
  other; a second surface at the same time is a sign the first should have been a dialog.
- **Don't** put a form a reader must finish in it. Nothing stops them clicking away mid-way, which
  is the whole point of a non-modal panel and the whole reason a confirmation is not one.

**By hand, in real Chromium**: run `bun run demos` and open
`/frameworks/angular/components/feedback/sheet/Sheet.demo.generated.html`:
- The page behind the panel still scrolls and its buttons still take a click, at every placement.
- Folding leaves the header and the footer in place and moves nothing else; the caret turns with it.
- A `Menu` opened from inside the panel paints over the panel, and the panel paints over a fixed
  bottom bar.
- Tab from the last control in the panel leaves it and lands on the page; nothing is trapped.
- At 390px the bottom panel clears the home indicator when the browser emulates a device inset.
