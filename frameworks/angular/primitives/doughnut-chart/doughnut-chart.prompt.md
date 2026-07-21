Arena doughnut — parts of one whole, hand-written SVG, every colour a token. The legend is
not optional: slices are categories, and identity is never colour alone. Colours come from
the categorical ramp in order and are never cycled; there is no `tone` input, because a
slice cannot be a status. The ring starts at 12 o'clock, the hole is 62% of the outer
radius, and hovering either a slice or its legend row dims the others and reads that
slice's percentage in the hole. The numbers are also a real table for anyone who cannot see
the ring.

```html
<arena-doughnut-chart [labels]="regions" [values]="revenue" [valueFormatter]="currency" />
```

`slots` overrides the ramp order, for when a category must keep the same colour it has in a
sibling chart:

```html
<arena-doughnut-chart [labels]="regions" [values]="revenue" [slots]="[3, 1, 5]" />
```

The chart sizes itself to its container — give it a parent with a width (an
`arena-chart-card` is the usual one) rather than setting a width on the chart. The host is
the flex row itself: the ring is one item, the legend the other, and the host is what gets
measured.

**Do / Don't**
- Keep it to five or six slices. Past that the arcs stop being comparable and a bar chart
  reads better — that is not a rendering limit, it is what the shape can carry.
- Make sure the values really are parts of one whole. Two doughnuts whose slices come from
  different totals are two charts that look like one.
- Don't ask for a ninth colour. The ramp has eight slots and is never cycled, so a ninth
  slice repeats slot 8 rather than silently claiming two categories are one — fold the tail
  into "Other" instead.
- Don't use it for change over time. That is `arena-line-chart`.
- Don't pass more `labels` than `values`. A slice is drawn per value and takes the label at
  its own index, so a surplus label is silently dropped rather than given a legend row with
  no slice behind it.
- Don't place it on a surface other than `--surface-card`. The gap between slices is that
  surface showing through a `--surface-card` stroke, not a border on the slice; on a
  different background the gaps read as stripes of the wrong colour.

**Known accessibility gap.** The legend column is an `overflow: auto` scroll region with
nothing focusable inside it, so on Chrome — which, unlike Firefox, does not tab to
scrollable containers — a keyboard-only user cannot scroll it. The visually-hidden numbers
table does not cure this: it is invisible to a *sighted* keyboard user, who can see the
legend and cannot reach it. Keeping to five or six slices, as above, is what keeps the
region from needing to scroll at all, and is the reason this has not yet bitten. The fix
is `tabindex="0"` with `role="group"` and an `aria-label` on the legend column, applied
across all three charts and both layers at once rather than here alone. Hover-only data
is the milder half of the same gap and affects all three charts: every label and value is
already in the visually-hidden table, so only the centre percentage is pointer-exclusive.
