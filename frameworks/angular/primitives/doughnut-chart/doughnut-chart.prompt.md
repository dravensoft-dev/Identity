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

**The legend is keyboard-reachable.** The legend column is an `overflow: auto` scroll
region, and it carries `tabindex="0"`, `role="group"` and `aria-label="Doughnut chart
legend"` (`doughnut-chart.ts:200`), so on Chrome — which, unlike Firefox, does not tab to
scrollable containers on its own — a keyboard-only user can still Tab to the column and
scroll it. `role="group"` was chosen over the WAI scrollable-region pattern's
`role="region"` because a region is meant to be a landmark a user jumps to directly;
this column is one row of a small chart, not a page landmark, and `aria-label` still
gives it an accessible name either way. The visually-hidden numbers table does not
substitute for this: it is invisible to a *sighted* keyboard user, who can see the
legend and, before this fix, could not reach it. This closes the Angular half of the
gap only — `DoughnutChart.jsx`'s legend has the identical `overflow: auto` with no
`tabindex`, `role` or `aria-label`, and still needs the same treatment (see
`components-divergences.md`). It was never needed on the other two charts: BarChart's
and LineChart's own scroll regions are `overflow: visible` (`bar-chart.ts:128`,
`line-chart.ts:141`), so neither one traps a keyboard user the way a scrollable box
with nothing focusable inside it does. Hover-only data is a separate, still-open gap
and affects all three charts: every label and value is already in the visually-hidden
table, so only the centre percentage is pointer-exclusive.
