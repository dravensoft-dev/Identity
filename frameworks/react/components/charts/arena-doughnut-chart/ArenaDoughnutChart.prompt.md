Parts of one whole, a share breakdown across a handful of categories. Always draws a legend with the label and value beside each swatch: the slices are the series, and identity is never carried by color alone. Hovering a slice or a legend row highlights both and shows the share in the hole.

```tsx
<ArenaChartCard title="Traffic by service">
  <ArenaDoughnutChart labels={['Web','API','Worker','Static']} values={[420,310,140,90]}
    seriesLabel="Traffic" valueSuffix=" rps" />
</ArenaChartCard>
```

<!-- @api GENERATED from contracts/api/components/ArenaDoughnutChart.json. Edit the contract, not this table. -->

**Members**, in contract order and under this layer's own names. `*` marks a required one.

| Member | Form | Type | Default | What it is |
|---|---|---|---|---|
| `labels*` | array | `readonly string[]` |  | One label per slice, in the same order as `values`. A label with no value at its index is dropped. |
| `values*` | array | `readonly number[]` |  | The parts, which are read as shares of their own total. A negative value floors at zero; a total of zero paints nothing. |
| `seriesLabel*` | primitive | `string` |  | Names the chart for the accessible name, the table caption and its value column. Required and guarded rather than defaulted: a fallback of the chart TYPE satisfies roles.label mechanically and tells a screen-reader user nothing, so two charts on one page announce identically. Nothing can derive it -- what a chart is about is editorial, the same reason ArenaTable.label is required. |
| `slots` | array | `readonly number[]` |  | Per-slice identity override, one ramp slot each. Absent assigns 1..N in order, which is the rule rather than a starting point. |
| `valueSuffix` | primitive | `string` |  | Appended verbatim to every number the chart draws: the legend value and the accessible table. Not the centre label, which is a percentage rather than a value. |
| `valuePrefix` | primitive | `string` |  | Drawn verbatim before every number the chart writes, as valueSuffix is drawn after it. A currency that precedes its amount is the majority case worldwide and had no expression: with suffix alone, "1234.5 Bs." is what a chart drew where the table beside it read "Bs. 1.234,50", and the accessible table inherited the disagreement. |
| `legendLayout` | enum | `ArenaChartLegendLayout` | `"auto"` | How each legend row arranges its label and its figure. 'inline' puts them on one line, which is what fits a wide tile; 'stacked' puts the label above the figure; 'auto' measures the legend column and stacks when the row does not give. It exists because the two do not degrade equally: on one line the figure does not yield, so the label is what gets truncated, and a legend of numbers with nothing saying what they count is the opposite of a legend. The threshold is already declared, as the chart-legend-min and chart-legend-max tokens the ring width is clamped between; what was missing was the behaviour. |
| `onSliceActivate` | event | `number` |  | A slice was activated by pointer, carrying its index in `values`. **In `values`, never in the drawn paths**, and that is the whole member: a slice worth zero paints nothing, so the shapes on screen and the entries in the array are two different lists, and a consumer indexing the SVG has to reproduce that omission from outside to translate one into the other. It is reverse engineering of a component's own DOM, which the next release breaks in silence. |
| `valueFormat` | object | `ArenaNumberFormat` |  | How each number is written before the prefix and suffix are added: which locale, how many fraction digits, whether thousands are grouped, whether large numbers are compacted. Absent, the raw JavaScript number, which is what this chart drew before the member existed. |

<!-- @api end -->

**Do**
- Keep it to a handful of slices. Past five or six, the small ones are unreadable; fold the tail into "Other", or use bars.
- Let `slots` default. ArenaSlots 1..N in order is the rule, not a starting point to tweak.
- Use it only when the parts genuinely sum to one whole. If they don't, it is a bar chart.
- Pass `seriesLabel`, because it names the chart for a screen reader, titles the numbers table and names its value column. Without it the chart announces as "Doughnut chart", which identifies the chart *type* and not the chart.
- Pass `valueSuffix` for units. It reaches the legend and the accessible table, and never the centre percentage.

**Don't**
- Don't reach for `tone`: it doesn't exist here. Slices are categories by definition; a doughnut has no state to report.
- Use `valuePrefix` for a currency that goes in front, and `valueFormat` for the number itself: locale, fraction digits, grouping, compaction. Formatting before you pass them is not an option, because what you pass is `number[]` and the writing happens on labels Arena generates afterwards. With no `valueFormat` the raw JavaScript number is drawn, which is what a chart always did.
- Don't go past eight categories. The ramp is eight slots and is never cycled: a ninth slice would repeat slot 1 and claim two categories are one.
- Don't compare two doughnuts side by side. Reading angle differences across charts is the thing people are worst at; use grouped bars.
- Don't omit `labels` or `values`. Both are required props, `ArenaDoughnutChart` throws from its render rather than drawing an empty ring. A required member absent is a caller bug that fails hard in every layer, not a state to render.
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
