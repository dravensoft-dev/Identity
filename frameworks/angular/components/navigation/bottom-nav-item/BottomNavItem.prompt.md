One destination in an `arena-bottom-nav`: glyph above label, an equal share of the bar's width.
Standalone, `OnPush`, signal I/O. It renders no wrapper of its own, so the host declares
`display: contents` and the anchor or the button inside is what the bar lays out.

Which destination is active and how this one reports are settled with the parent it injects, so
nothing about that is a member here.

```html
<arena-bottom-nav-item id="orders" icon="ph-bold ph-receipt" label="Orders" href="/orders" [badge]="12" />
<arena-bottom-nav-item id="more" icon="ph-bold ph-dots-three" label="More" />
```

**`icon` is required here where a sidebar leaves it optional**, and the active weight is not a
member: the destination whose `id` matches the bar's `active` has whatever weight the string carries
swapped for `ph-fill`, so pass one string per destination rather than two and a conditional. Passing
`ph-fill` yourself changes nothing, because the swap is idempotent.

**`label` is drawn, not hidden.** A bar of glyphs alone asks every reader to have learnt the icons.

`href` decides the element: present renders an `<a>`, absent a `<button type="button">`. A
destination that navigates must be a link; an item that only opens a local sheet is a button.

`badge` is a number, and Arena applies the two rules: zero draws nothing, and anything above 99 reads
`99+` so the column cannot widen. It is announced, so the destination reads "Orders 12".

`disabled` draws the destination and refuses it, through `aria-disabled` rather than the native
attribute, so a reader still hears that it exists.

**Do / Don't**
- **Do** keep the label to one word where you can. The column is a fifth of a phone, and a long one
  truncates.
- **Don't** format the badge yourself. A string would take the two rules away.
- **Don't** write it outside an `arena-bottom-nav`. It injects the bar, so without one there is no
  provider and Angular throws rather than rendering a destination that can never be current.

**By hand, in real Chromium**: run `bun run demos` and open
`/frameworks/angular/components/navigation/bottom-nav/BottomNav.demo.generated.html` at 390px:
- A destination with a badge of 0 shows none, one of 4821 shows `99+`, and neither widens its column.
- Tab reaches every destination once, in source order, and the disabled one announces itself as
  disabled rather than being skipped.
- A five-word label truncates with an ellipsis instead of pushing its neighbours out of line.
