Arena line chart — one series over time, hand-written SVG, every colour a token. An
optional 18% area tint sits under the line. The crosshair snaps to the nearest point
rather than drifting between them, and the numbers are also a real table for anyone who
cannot see the line. Identity comes from `slot`, meaning from `tone`; passing both warns
and `tone` wins, because a chart carries identity or meaning, never both.

```html
<arena-line-chart [labels]="days" [values]="latency" seriesLabel="p95 latency" [slot]="3"
                  [area]="true" />
<arena-line-chart [labels]="days" [values]="errorRate" seriesLabel="Error rate" tone="danger" />
```

`valueFormatter` formats the tick labels, the tooltip and the numbers table together, so
a unit written once appears everywhere:

```html
<arena-line-chart [labels]="days" [values]="latency" seriesLabel="p95"
                  [valueFormatter]="msFormatter" />
```

The chart sizes itself to its container — give it a parent with a width (an
`arena-chart-card` is the usual one) rather than setting a width on the chart. The host
is a block-level, positioned box: it is what gets measured, and it is what the hover
tooltip is positioned against.

**Do / Don't**
- Give `seriesLabel` — it names the chart for a screen reader and titles the numbers
  table underneath.
- Use `area` for a volume or a total, not for a rate. A filled area says "this much of
  something"; a rate has nothing to fill.
- Use `tone` only when the series genuinely *is* a state. A red line means "bad", and a
  red line that just means "the third series" makes the chart lie.
- Don't plot two series by stacking two line charts. One axis, one series; two series
  that share a scale need a chart Arena does not ship yet, and two that do not share one
  are two charts.
- Don't pass more `labels` than `values`. A point is drawn per value and takes the label
  at its own index, so a surplus label is silently dropped rather than drawn with no
  point above it.
- Don't write `area="false"` expecting the fill to disappear. A bare `area` and
  `[area]="true"` both mean true — `area` carries the `booleanAttribute` transform, so a
  bare attribute now behaves like a native HTML boolean attribute. But unlike a native
  attribute, the literal string `"false"` also reads as **false**, since
  `booleanAttribute` special-cases that one value rather than treating any present
  value as true. Bind a computed value instead: `[area]="isVolume"`.
