A line for a value over an ordered sequence, time, builds, releases. Hovering anywhere snaps a crosshair to the nearest point and shows its tooltip. Dependency-free SVG; it re-themes with the page for free.

```tsx
<LineChart labels={days} values={[120,138,131,142,180,164,150]} seriesLabel="p95 ms" />

{/* area: one series, a tint of the line */}
<LineChart labels={days} values={latency} seriesLabel="p95 ms" slot={5} area
  valueSuffix=" ms" />

{/* meaning: the series IS a state */}
<LineChart labels={days} values={errorRate} tone="danger" seriesLabel="Error rate"
  valueSuffix="%" />
```

**Do**
- Use a line for ordered data. If the categories have no order, bars compare them more honestly.
- Turn `area` on for a single series to give the trend weight.
- Pass `valueSuffix` so the axis, the tooltip and the accessible table all carry the unit. It is appended verbatim, so write the space yourself: `" ms"`, but `"%"`.

**Don't**
- Don't pass `tone` together with `slot`: identity or meaning, never both. It warns in development and `tone` wins.
- Don't add a second axis. Arena charts have one; a dual axis invents a correlation the data never claimed.
- Don't stack `area` fills for several series, because they occlude each other and the reader cannot recover the values. Use plain lines, or small multiples.
- Use `valuePrefix` for a currency that goes in front, and `valueFormat` for the number itself: locale, fraction digits, grouping, compaction. Formatting before you pass them is not an option, because what you pass is `number[]` and the writing happens on labels Arena generates afterwards. With no `valueFormat` the raw JavaScript number is drawn, which is what a chart always did.
- Don't omit `labels` or `values`. Both are required props, `LineChart` throws from its render rather than drawing an empty box. A required member absent is a caller bug that fails hard in every layer, which `contracts/api/README.md` states under required-ness. A chart with no data is a caller bug, not a state to render.
- Don't pass more `labels` than `values`. A point is drawn per value and takes the label at its own index, so a surplus label is silently dropped rather than drawn with no point above it.


### When the points stop fitting

`minPointSpacing` is the narrowest gap, in px, the chart will draw between two adjacent
points. Below it the chart stops compressing and overflows sideways instead, in a rail that
scrolls and starts anchored to the most recent point. Marker spacing is a legibility constant
rather than something that yields to the viewport: thirty days in 390px is unreadable at any
font size.

Arena computes the minimum width from its own axis padding, so nothing outside needs to know
what that padding is, and the rail is the chart's own box rather than the card's: a
`ChartCard` around it needs no change. The rail takes `tabIndex={0}` and a `role="group"`
named after the chart, but only while it actually overflows, because a rail that fits is not
a scroll region and a tab stop on it would be dead.

`height` is the plot's height in px, the `--chart-height` token by default. A number rather
than a length string, because the chart does arithmetic with it to place every mark.
