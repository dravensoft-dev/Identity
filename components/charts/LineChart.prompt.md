A line for a value over an ordered sequence — time, builds, releases. Hovering anywhere snaps a crosshair to the nearest point and shows its tooltip. Dependency-free SVG; it re-themes with the page for free.

```jsx
<LineChart labels={days} values={[120,138,131,142,180,164,150]} seriesLabel="p95 ms" />

{/* area — one series, a tint of the line */}
<LineChart labels={days} values={latency} seriesLabel="p95 ms" slot={5} area
  valueFormatter={(v) => `${v} ms`} />

{/* meaning — the series IS a state */}
<LineChart labels={days} values={errorRate} tone="danger" seriesLabel="Error rate"
  valueFormatter={(v) => `${v}%`} />
```

**Do**
- Use a line for ordered data. If the categories have no order, bars compare them more honestly.
- Turn `area` on for a single series to give the trend weight.
- Pass `valueFormatter` so the axis and the tooltip both carry the unit.

**Don't**
- Don't pass `tone` together with `slot` — identity or meaning, never both. It warns in development and `tone` wins.
- Don't add a second axis. Arena charts have one; a dual axis invents a correlation the data never claimed.
- Don't stack `area` fills for several series — they occlude each other and the reader cannot recover the values. Use plain lines, or small multiples.
