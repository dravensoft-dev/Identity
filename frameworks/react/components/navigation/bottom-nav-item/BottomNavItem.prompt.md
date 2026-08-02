One destination in a `BottomNav`: glyph above label, an equal share of the bar's width. Which one is
active and how it reports are settled with its parent, so nothing about that is written here.

```tsx
<BottomNavItem id="orders" icon="ph-bold ph-receipt" label="Orders" href="/orders" badge={12} />
<BottomNavItem id="more" icon="ph-bold ph-dots-three" label="More" />
```

**`icon` is required here where a sidebar leaves it optional**, and the active weight is not a
member: the destination whose `id` matches the bar's `active` has whatever weight the string carries
swapped for `ph-fill`, so pass one string per destination rather than two and a conditional. Passing
`ph-fill` yourself changes nothing, because the swap is idempotent.

**`label` is drawn, not hidden.** A bar of glyphs alone asks every reader to have learnt the icons.

`href` decides the element: present renders an `<a>`, absent a `<button>`. A destination that
navigates must be a link; an item that only opens a local sheet is a button.

`badge` is a number, and Arena applies the two rules: zero draws nothing, and anything above 99 reads
`99+` so the column cannot widen. It is announced, so the destination reads "Orders 12".

`disabled` draws the destination and refuses it, through `aria-disabled` rather than the native
attribute, so a reader still hears that it exists.

**Do / Don't**
- **Do** keep the label to one word where you can. The column is a fifth of a phone, and a long one
  truncates.
- **Don't** format the badge yourself. A string would take the two rules away.
- **Don't** write it outside a `BottomNav`. Nothing injects the active id there, so no destination is
  ever marked current.
