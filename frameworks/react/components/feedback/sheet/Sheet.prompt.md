A working surface anchored to one edge of the page, kept open beside the page rather than over it:
a cart, a filter drawer, a detail pane. It carries no scrim, traps no focus and takes nothing away
from what is behind it. **When a panel is meant to take the whole interaction until it is answered,
that is a `Dialog`**, two stacking slots higher, and the scrim is how it says so.

```tsx
<Sheet open={cartOpen} placement="end" title="Cart"
       collapsed={folded} onCollapsedChange={setFolded}
       dismissible onClose={() => setCartOpen(false)}
       footer={<Button onClick={checkout}>Checkout</Button>}>
  {lines.map((line) => <CartLine key={line.id} line={line} />)}
</Sheet>
```

**Closed and collapsed are two different states, and both exist.** `open` decides whether the panel
is on the page at all; `collapsed` folds the body away and leaves the header and the footer where
they were. That is what the pattern buys: a reader can put the cart out of the way and still see
what it is and still check out, without losing it.

`title` is required and guarded rather than defaulted. It heads the panel, and it is also the
accessible name of the fold control, so a screen-reader user hears "Cart, collapse" rather than
"Toggle". Nothing can derive it, because what the panel is showing is editorial.

**Escape reports through `onClose`**, which is why answering it costs no member. It reaches the
panel only while focus is inside it: nothing here took focus in the first place, and a panel that
swallowed Escape from across the page would break the dialog a reader has open somewhere else.

**Do / Don't**
- **Do** own both booleans. Neither folds nor closes itself, so a handler that ignores
  `onCollapsedChange` gets a caret that turns and a body that does not move.
- **Do** put the one action the panel exists for in `footer`. It sits outside the folding body, so
  a folded panel still carries it.
- **Don't** reach for it as a menu or a popover. It spans a whole edge and stays; `Menu` is the
  transient list that hangs off a trigger.
- **Don't** open two at once on the same edge. They share a stacking slot and one lands on the
  other; a second surface at the same time is a sign the first should have been a `Dialog`.
- **Don't** put a form a reader must finish in it. Nothing stops them clicking away mid-way, which
  is the whole point of a non-modal panel and the whole reason a confirmation is not one.
