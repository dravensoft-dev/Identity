Parts of one whole, a share breakdown across a handful of categories. Always draws a legend with the label and value beside each swatch: the slices are the series, and identity is never carried by color alone. Hovering a slice or a legend row highlights both and shows the share in the hole.

```tsx
<ChartCard title="Traffic by service">
  <DoughnutChart labels={['Web','API','Worker','Static']} values={[420,310,140,90]}
    seriesLabel="Traffic" valueSuffix=" rps" />
</ChartCard>
```

**Do**
- Keep it to a handful of slices. Past five or six, the small ones are unreadable; fold the tail into "Other", or use bars.
- Let `slots` default. Slots 1..N in order is the rule, not a starting point to tweak.
- Use it only when the parts genuinely sum to one whole. If they don't, it is a bar chart.
- Pass `seriesLabel`, because it names the chart for a screen reader, titles the numbers table and names its value column. Without it the chart announces as "Doughnut chart", which identifies the chart *type* and not the chart.
- Pass `valueSuffix` for units. It reaches the legend and the accessible table, and never the centre percentage.

**Don't**
- Don't reach for `tone`: it doesn't exist here. Slices are categories by definition; a doughnut has no state to report.
- Use `valuePrefix` for a currency that goes in front, and `valueFormat` for the number itself: locale, fraction digits, grouping, compaction. Formatting before you pass them is not an option, because what you pass is `number[]` and the writing happens on labels Arena generates afterwards. With no `valueFormat` the raw JavaScript number is drawn, which is what a chart always did.
- Don't go past eight categories. The ramp is eight slots and is never cycled: a ninth slice would repeat slot 1 and claim two categories are one.
- Don't compare two doughnuts side by side. Reading angle differences across charts is the thing people are worst at; use grouped bars.
- Don't omit `labels` or `values`. Both are required props, `DoughnutChart` throws from its render rather than drawing an empty ring. A required member absent is a caller bug that fails hard in every layer, which `contracts/api/README.md` states under required-ness. A chart with no data is a caller bug, not a state to render.
- Don't pass more `labels` than `values`. A slice is drawn per value and takes the label at its own index, so a surplus label is silently dropped rather than given a legend row with no slice behind it.

### Reading a slice back, and reading a legend on a phone

`onSliceActivate` carries the index **in `values`**, and that is the whole member. A slice worth
zero paints no path, so the shapes on screen and the entries in the array are two different
lists; a consumer indexing `querySelectorAll('path')` has to reproduce that omission from
outside to translate one into the other, and the next release breaks it in silence. Both the arc
and its legend row report, so the zero-valued entry, which has no arc, is still reachable.

`legendLayout` decides how each legend row arranges its label and its figure: `inline` on one
line, `stacked` with the label above, `auto` measuring the legend column and stacking when the
row does not give. The default is `auto`, and it matters because the two do not degrade equally:
on one line the figure does not yield, so at 390px the label is what gets cut, and a column of
numbers with nothing saying what they count is the opposite of a legend.
