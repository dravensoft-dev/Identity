A line for a value over an ordered sequence — time, builds, releases. Hovering anywhere snaps a crosshair to the nearest point and shows its tooltip. Dependency-free SVG; it re-themes with the page for free.

```jsx
<LineChart labels={days} values={[120,138,131,142,180,164,150]} seriesLabel="p95 ms" />

{/* area — one series, a tint of the line */}
<LineChart labels={days} values={latency} seriesLabel="p95 ms" slot={5} area
  valueSuffix=" ms" />

{/* meaning — the series IS a state */}
<LineChart labels={days} values={errorRate} tone="danger" seriesLabel="Error rate"
  valueSuffix="%" />
```

**Do**
- Use a line for ordered data. If the categories have no order, bars compare them more honestly.
- Turn `area` on for a single series to give the trend weight.
- Pass `valueSuffix` so the axis, the tooltip and the accessible table all carry the unit. It is appended verbatim, so write the space yourself: `" ms"`, but `"%"`.

**Don't**
- Don't pass `tone` together with `slot` — identity or meaning, never both. It warns in development and `tone` wins.
- Don't add a second axis. Arena charts have one; a dual axis invents a correlation the data never claimed.
- Don't stack `area` fills for several series — they occlude each other and the reader cannot recover the values. Use plain lines, or small multiples.
- Don't expect `valueSuffix` to format. It appends a unit and nothing else — no rounding, no thousands separator, no currency. Format the numbers before you pass them.
- Don't omit `labels` or `values`. Both are required props — `LineChart` throws from its render rather than drawing an empty box, matching Angular's `input.required`. This is a break from the old `labels = []` default: a chart with no data is a caller bug, not a state to render.
- Don't pass more `labels` than `values`. A point is drawn per value and takes the label at its own index, so a surplus label is silently dropped rather than drawn with no point above it.
