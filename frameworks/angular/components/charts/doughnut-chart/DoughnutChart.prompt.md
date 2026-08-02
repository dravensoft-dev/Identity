Arena doughnut, parts of one whole, hand-written SVG, every colour a token. The legend is
not optional: slices are categories, and identity is never colour alone. Colours come from
the categorical ramp in order and are never cycled; there is no `tone` input, because a
slice cannot be a status. The ring starts at 12 o'clock, the hole is 62% of the outer
radius, and hovering either a slice or its legend row dims the others and reads that
slice's percentage in the hole. The numbers are also a real table for anyone who cannot see
the ring.

```html
<arena-doughnut-chart [labels]="regions" [values]="revenue" seriesLabel="Revenue" valueSuffix=" €" />
```

`valueSuffix` is appended verbatim to the legend value and to the numbers table, write the
space yourself. `valuePrefix` is drawn before the number the same way, for a currency that precedes its
amount. Between them, `valueFormat` says how the number itself is written: the locale, the
fraction digits, whether thousands are grouped, whether large numbers compact to `48,2K`.
Every field is data rather than a function, which is what keeps it a member at all, and
`Intl.NumberFormat` does the work. Formatting the values before binding them is not an option
and never was: what you bind is `number[]`, and the writing happens on labels Arena generates
afterwards. With no `valueFormat` the raw JavaScript number is drawn, which is the old
behaviour.

`seriesLabel` names the chart for a screen reader, titles the numbers table and names its
value column; without it the chart announces as "Doughnut chart", which identifies the
chart type and not the chart.

`slots` overrides the ramp order, for when a category must keep the same colour it has in a
sibling chart:

```html
<arena-doughnut-chart [labels]="regions" [values]="revenue" [slots]="[3, 1, 5]" />
```

The chart sizes itself to its container, give it a parent with a width (an
`arena-chart-card` is the usual one) rather than setting a width on the chart. The host is
the flex row itself: the ring is one item, the legend the other, and the host is what gets
measured.

**Do / Don't**
- Keep it to five or six slices. Past that the arcs stop being comparable and a bar chart
  reads better. That is not a rendering limit; it is what the shape can carry.
- Make sure the values really are parts of one whole. Two doughnuts whose slices come from
  different totals are two charts that look like one.
- Don't ask for a ninth colour. The ramp has eight slots and is never cycled, so a ninth
  slice repeats slot 8 rather than silently claiming two categories are one, fold the tail
  into "Other" instead.
- Don't use it for change over time. That is `arena-line-chart`.
- Don't omit `labels` or `values`. Both are required inputs, Angular throws NG0950 on the
  first read rather than drawing an empty ring. A chart with no data is a caller bug, not a
  state to render.
- Don't pass more `labels` than `values`. A slice is drawn per value and takes the label at
  its own index, so a surplus label is silently dropped rather than given a legend row with
  no slice behind it.
- Don't place it on a surface other than `--surface-card`. The gap between slices is that
  surface showing through a `--surface-card` stroke, not a border on the slice; on a
  different background the gaps read as stripes of the wrong colour.

**The legend is keyboard-reachable.** The legend column is an `overflow: auto` scroll
region, and it carries `tabindex="0"`, `role="group"` and `aria-label="Doughnut chart
legend"` (`DoughnutChart.ts`), so a keyboard-only user can Tab to the column and scroll
it. Current Chrome and Firefox do put a scrollable container in the tab order on their
own, so this is belt-and-braces on an up-to-date browser, but it is not something to
rely on: it is a recent default (Chrome shipped it in 127), older engines do not do it,
and a UA-supplied tab stop carries no accessible name. The explicit trio makes the
behaviour deterministic and names the region. `role="group"` was chosen over the WAI scrollable-region pattern's
`role="region"` because a region is meant to be a landmark a user jumps to directly;
this column is one row of a small chart, not a page landmark, and `aria-label` still
gives it an accessible name either way. The visually-hidden numbers table does not
substitute for this: it is invisible to a *sighted* keyboard user, who can see the
legend and would otherwise have no way to reach it. It was
never needed on the other two charts: neither
BarChart nor LineChart has a legend column at all, and their plot boxes are
`overflow: visible`, re-derive with `grep -n 'overflow:visible'
frameworks/angular/components/charts/bar-chart/BarChart.ts
frameworks/angular/components/charts/line-chart/LineChart.ts`, rather than a line
number, which has already gone stale once, nothing there scrolls,
so nothing there strands a keyboard user the way a scrollable box with nothing focusable
inside it does. Every label and value is already in the visually-hidden table, so the centre
percentage is the only figure the pointer alone reveals, and `(sliceActivate)` is a pointer
affordance for the same reason: it reports what was clicked, and a keyboard user reaches the
same information through the table.

### Reading a slice back, and reading a legend on a phone

`(sliceActivate)` carries the index **in `values`**, and that is the whole member. A slice worth
zero paints no path, so the shapes on screen and the entries in the array are two different
lists; a consumer indexing `querySelectorAll('path')` has to reproduce that omission from
outside to translate one into the other, and the next release breaks it in silence. Both the arc
and its legend row report, so the zero-valued entry, which has no arc, is still reachable.

`legendLayout` decides how each legend row arranges its label and its figure: `inline` on one
line, `stacked` with the label above, `auto` measuring the legend column and stacking when the
row does not give. The default is `auto`, and it matters because the two do not degrade equally:
on one line the figure does not yield, so at 390px the label is what gets cut, and a column of
numbers with nothing saying what they count is the opposite of a legend.
