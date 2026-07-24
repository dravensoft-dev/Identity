Bars for comparing a value across categories. Dependency-free SVG: it reads `var(--color-cat-N)` directly, so it re-themes with the page for free. Hover gives a per-bar tooltip; the numbers are also exposed as a table for screen readers.

```jsx
{/* identity — the default, one color for the whole series */}
<BarChart labels={['Mon','Tue','Wed','Thu','Fri']} values={[12,19,9,22,17]} seriesLabel="Deploys" />

{/* identity — per-bar, when the bars are different things */}
<BarChart labels={['Web','API','Worker']} values={[24,18,7]} slots={[1,2,3]} seriesLabel="Services" />

{/* meaning — the series IS a state */}
<BarChart labels={['Mon','Tue','Wed']} values={[2,5,1]} tone="danger" seriesLabel="Failed builds"
  valueSuffix=" builds" />
```

**Do**
- Default to one identity color for the series. Per-bar `slots` is for when each bar is genuinely a different thing, not for decoration.
- Assign slots in order — 1, 2, 3 — and let a ninth category fold into "Other". The ramp is eight slots and is never cycled.
- Reach for `tone` only when the series *is* a state: failed builds, error rate. That is what makes red mean red.
- Pass `valueSuffix` for units — the axis, the tooltip and the accessible table all carry it. It is appended verbatim, so write the space yourself: `" ms"`, but `"%"`.

**Don't**
- Don't pass `tone` together with `slot`/`slots`. A chart carries identity or meaning, never both — it warns in development and `tone` wins.
- Don't use status colors as series colors by hand. A series painted `--danger` reads as an error, and that is exactly the bug this API exists to prevent.
- Don't reach past eight categories. Nine bars in eight slots means two of them lie about being the same.
- Don't add a second axis. Arena charts have one; a dual axis invents a correlation the data never claimed.
- Don't expect `valueSuffix` to format. It appends a unit and nothing else — no rounding, no thousands separator, no currency. Format the numbers before you pass them.
- Don't omit `labels` or `values`. Both are required props — `BarChart` throws from its render rather than drawing an empty box, matching Angular's `input.required`. This is a break from the old `labels = []` default: a chart with no data is a caller bug, not a state to render.
- Don't pass more `labels` than `values`. A bar is drawn per value and takes the label at its own index, so a surplus label is silently dropped rather than drawn without a bar to sit under.
