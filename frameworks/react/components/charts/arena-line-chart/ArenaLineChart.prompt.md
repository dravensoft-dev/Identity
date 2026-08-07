A line for a value over an ordered sequence, time, builds, releases. Hovering anywhere snaps a crosshair to the nearest point and shows its tooltip. Dependency-free SVG; it re-themes with the page for free.

```tsx
<ArenaLineChart labels={days} values={[120,138,131,142,180,164,150]} seriesLabel="p95 ms" />

{/* area: one series, a tint of the line */}
<ArenaLineChart labels={days} values={latency} seriesLabel="p95 ms" slot={5} area
  valueSuffix=" ms" />

{/* meaning: the series IS a state */}
<ArenaLineChart labels={days} values={errorRate} tone="danger" seriesLabel="Error rate"
  valueSuffix="%" />
```

<!-- @api GENERATED from contracts/api/components/ArenaLineChart.json. Edit the contract, not this table. -->

**Members**, in contract order and under this layer's own names. `*` marks a required one.

| Member | Form | Type | Default | What it is |
|---|---|---|---|---|
| `labels*` | array | `readonly string[]` |  | One label per point, in the same order as every series' `values`. A label with no value in a series ends that series' line there rather than dropping to zero. |
| `series*` | array | `readonly ArenaSeries[]` |  | The plotted series, drawn as one polyline each over the same ordered sequence. One series is the common case and draws exactly what it drew before. The area fill is refused past one series, because two fills occlude each other and the reader cannot tell which value either edge belongs to. |
| `label*` | primitive | `string` |  | Names the chart for its accessible name and for the caption of its data table. This is the CHART's name, not a series': a series names itself. Required and guarded rather than defaulted, because a fallback of the chart TYPE satisfies roles.label mechanically and tells a screen-reader user nothing, so two charts on one page announce identically. |
| `area` | primitive | `boolean` | `false` | Fill under the line at 18% of the series colour: a tint, never a gradient. For a single series; two fills occlude each other. |
| `valueSuffix` | primitive | `string` |  | Appended verbatim to every number the chart draws: the axis ticks, the tooltip and the accessible table. Carries its own leading space if one is wanted. |
| `valuePrefix` | primitive | `string` |  | Drawn verbatim before every number the chart writes, as valueSuffix is drawn after it. A currency that precedes its amount is the majority case worldwide and had no expression: with suffix alone, "1234.5 Bs." is what a chart drew where the table beside it read "Bs. 1.234,50", and the accessible table inherited the disagreement. |
| `valueFormat` | object | `ArenaNumberFormat` |  | How each number is written before the prefix and suffix are added: which locale, how many fraction digits, whether thousands are grouped, whether large numbers are compacted. Absent, the raw JavaScript number, which is what this chart drew before the member existed. |
| `height` | primitive | `number` | `280` | The plot's height in px, the --chart-height token by default. A number rather than a dimension string, because the chart does arithmetic with it to place every mark, and a caller-supplied "20rem" is neither a token nor a derivation of one. |
| `minPointSpacing` | primitive | `number` |  | The narrowest gap, in px, the chart draws between two adjacent points. Below it the chart stops compressing and overflows its container horizontally instead, scrolled and anchored to the most recent point: marker spacing is a legibility constant, not something that yields to the viewport, and thirty days in 390px is unreadable at any font size. Absent, the chart fits whatever width it is given. The rail it scrolls in is the same region the data cursor lives in, and it is keyboard-reachable whether it overflows or not. |

<!-- @api end -->

**Do**
- Use a line for ordered data. If the categories have no order, bars compare them more honestly.
- Turn `area` on for a single series to give the trend weight.
- Pass `valueSuffix` so the axis, the tooltip and the accessible table all carry the unit. It is appended verbatim, so write the space yourself: `" ms"`, but `"%"`.

**Don't**
- Don't pass `tone` together with `slot`: identity or meaning, never both. It warns in development and `tone` wins.
- Don't add a second axis. Arena charts have one; a dual axis invents a correlation the data never claimed.
- Don't stack `area` fills for several series, because they occlude each other and the reader cannot recover the values. Use plain lines, or small multiples.
- Use `valuePrefix` for a currency that goes in front, and `valueFormat` for the number itself: locale, fraction digits, grouping, compaction. Formatting before you pass them is not an option, because what you pass is `number[]` and the writing happens on labels Arena generates afterwards. With no `valueFormat` the raw JavaScript number is drawn, which is what a chart always did.
- Don't omit `labels` or `values`. Both are required props, `ArenaLineChart` throws from its render rather than drawing an empty box. A required member absent is a caller bug that fails hard in every layer, not a state to render.
- Don't pass more `labels` than `values`. A point is drawn per value and takes the label at its own index, so a surplus label is silently dropped rather than drawn with no point above it.


### When the points stop fitting

`minPointSpacing` is the narrowest gap, in px, the chart will draw between two adjacent
points. Below it the chart stops compressing and overflows sideways instead, in a rail that
scrolls and starts anchored to the most recent point. Marker spacing is a legibility constant
rather than something that yields to the viewport: thirty days in 390px is unreadable at any
font size.

Arena computes the minimum width from its own axis padding, so nothing outside needs to know
what that padding is, and the rail is the chart's own box rather than the card's: a
`ArenaChartCard` around it needs no change. The rail takes `tabIndex={0}` and a `role="group"`
named after the chart, but only while it actually overflows, because a rail that fits is not
a scroll region and a tab stop on it would be dead.

`height` is the plot's height in px, the `--chart-height` token by default. A number rather
than a length string, because the chart does arithmetic with it to place every mark.
