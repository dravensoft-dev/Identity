Arena bar chart. One axis, hand-written SVG, every colour a token — so it re-themes
with the rest of Arena and costs no dependency. Identity comes from `slot` (one colour
for the series) or `slots` (a colour per bar, **in ramp order, never cycled**); meaning
comes from `tone`. Passing both warns and `tone` wins, because a chart carries identity
or meaning, never both.

```html
<arena-bar-chart [labels]="weeks" [values]="counts" seriesLabel="Deployments" [slot]="1" />
<arena-bar-chart [labels]="services" [values]="errors" seriesLabel="Errors" tone="danger" />
```

`valueFormatter` formats the tick labels, the tooltip and the numbers table together,
so a unit written once appears everywhere:

```html
<arena-bar-chart [labels]="regions" [values]="latency" seriesLabel="p95"
                 [valueFormatter]="msFormatter" />
```

The chart sizes itself to its container — give it a parent with a width (an
`arena-chart-card` is the usual one) rather than setting a width on the chart. The host
is a block-level, positioned box: it is what gets measured, and it is what the hover
tooltip is positioned against.

**Do / Don't**
- Give `seriesLabel` — it names the chart for a screen reader and titles the numbers
  table underneath.
- Use `tone` only when the series genuinely *is* a state. A red bar means "bad", and a
  red bar that just means "the second category" makes the chart lie.
- Don't pass a ninth `slots` entry expecting a ninth colour. The ramp is eight, in
  order; a ninth series folds into "Other" or becomes small multiples.
- Don't add a second axis. Arena's charts are one axis, always.
- Don't pass more `labels` than `values`. A bar is drawn per value and takes the label
  at its own index, so a surplus label is silently dropped rather than drawn without a
  bar to sit under.
