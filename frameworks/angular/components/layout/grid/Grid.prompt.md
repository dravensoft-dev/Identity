Arena grid, the one that picks its own column count from the room it is in so nobody has to pick a
breakpoint. Standalone, `OnPush`, signal I/O. Styling is the sibling `Grid.variants.ts` recipe; the
component carries no CSS classes of its own, and the host **is** the grid, so `<arena-grid>` is the
element you place.

```html
<arena-grid gap="md">
  <arena-stat-card label="Open orders" [value]="open()" />
  <arena-stat-card label="Overdue" [value]="overdue()" tone="danger" />
  <arena-stat-card label="Collected today" [value]="collected()" />
</arena-grid>
```

**It replaces a hand-written column list, not a `minmax(0, 1fr)` in one.** A fixed column count
needs a threshold, and a threshold is a number somebody invented: six filter bars written by hand
end up with three different ones and none of them matches `--bp-*`. Here the floor is `min` and it
is clamped with `min(<min>, 100%)`, so a minimum wider than the container gives one full-width
column rather than an overflow. **This is also the answer to a media query in a `styles:` block**,
which cannot read a `var()` and so has to restate a threshold Arena already holds.

`gap` is four named steps, `none`, `sm`, `md`, `lg`, and not a length. Rhythm is what the spacing
scale is for, and a grid is where a hand-picked gap shows worst: two grids on one page with gaps a
step apart read as a mistake.

`maxWidth` caps the grid and centres it. Leave it off inside a page and set it on the one grid that
is the page's own reading width.

**Do / Don't**
- **Do** give it real children. Every child is one cell exactly as written; nothing is wrapped, so
  an `arena-card`, a chart and a definition list all land the same way.
- **Do** reach for it for a page's own layout. A component that has to fit the room it was given
  measures its container with `containerWidth`, which is a different question.
- **Don't** use it for a row of two or three controls. That is a flex row, and a grid there gives
  every control the same width whether or not that helps.
- **Don't** put a `min` on it that no card ever reaches. The count only drops when the room runs
  out, so a minimum nobody meets pins the grid at one column forever.
- **Don't** nest one to make a two-level layout. Two grids nested pick their counts independently
  and the cells stop lining up; give the outer one the cells it actually has.

**By hand, in real Chromium**: run `bun run demos` and open
`/frameworks/angular/components/layout/grid/Grid.card.html`:
- Narrow the window from wide to 390px: the count falls one step at a time and never overflows.
- At the narrowest, one column fills the width; the minimum is clamped rather than honoured.
- The four gaps are visibly four steps, and both axes get the same one.
- With a `maxWidth` set, the grid centres and stops growing; without one, it fills.
