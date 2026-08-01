Arena bar chart. One axis, hand-written SVG, every colour a token, so it re-themes
with the rest of Arena and costs no dependency. Identity comes from `slot` (one colour
for the series) or `slots` (a colour per bar, **in ramp order, never cycled**); meaning
comes from `tone`. Passing both warns and `tone` wins, because a chart carries identity
or meaning, never both.

```html
<arena-bar-chart [labels]="weeks" [values]="counts" seriesLabel="Deployments" [slot]="1" />
<arena-bar-chart [labels]="services" [values]="errors" seriesLabel="Errors" tone="danger" />
```

`valueSuffix` is appended to the tick labels, the tooltip and the numbers table together,
so a unit written once appears everywhere. It is appended verbatim, write the space
yourself:

```html
<arena-bar-chart [labels]="regions" [values]="latency" seriesLabel="p95" valueSuffix=" ms" />
```

`valuePrefix` is drawn before the number the same way, for a currency that precedes its
amount. Between them, `valueFormat` says how the number itself is written: the locale, the
fraction digits, whether thousands are grouped, whether large numbers compact to `48,2K`.
Every field is data rather than a function, which is what keeps it a member at all, and
`Intl.NumberFormat` does the work. Formatting the values before binding them is not an option
and never was: what you bind is `number[]`, and the writing happens on labels Arena generates
afterwards. With no `valueFormat` the raw JavaScript number is drawn, which is the old
behaviour.

The chart sizes itself to its container, give it a parent with a width (an
`arena-chart-card` is the usual one) rather than setting a width on the chart. The host
is a block-level, positioned box: it is what gets measured, and it is what the hover
tooltip is positioned against.

**Do / Don't**
- Give `seriesLabel`, because it names the chart for a screen reader and titles the numbers
  table underneath.
- Use `tone` only when the series genuinely *is* a state. A red bar means "bad", and a
  red bar that just means "the second category" makes the chart lie.
- Don't pass a ninth `slots` entry expecting a ninth colour. The ramp is eight, in
  order; a ninth series folds into "Other" or becomes small multiples.
- Don't add a second axis. Arena's charts are one axis, always.
- Don't omit `labels` or `values`. Both are required inputs, Angular throws NG0950 on the
  first read rather than drawing an empty box. A chart with no data is a caller bug, not a
  state to render.
- Don't pass more `labels` than `values`. A bar is drawn per value and takes the label
  at its own index, so a surplus label is silently dropped rather than drawn without a
  bar to sit under.


### When the points stop fitting

`minPointSpacing` is the narrowest gap, in px, the chart will draw between two adjacent
points. Below it the chart stops compressing and overflows its container sideways instead,
in a rail that scrolls and starts anchored to the most recent point. Marker spacing is a
legibility constant rather than something that yields to the viewport: thirty days in 390px
is unreadable at any font size.

Arena computes the minimum width from its own axis padding, so nothing outside needs to know
what that padding is, and the rail is the chart's own box rather than the card's: an
`arena-chart-card` around it needs no change. The rail carries `tabindex="0"` and a
`role="group"` named after the chart, but only while it actually overflows, because a rail
that fits is not a scroll region and a tab stop on it would be dead.

`height` is the plot's height in px, the `--chart-height` token by default. It is a number
rather than a length string, because the chart does arithmetic with it to place every mark.
