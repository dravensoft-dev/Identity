Arena line chart, one series over time, hand-written SVG, every colour a token. An
optional 18% area tint sits under the line. The crosshair snaps to the nearest point
rather than drifting between them, and the numbers are also a real table for anyone who
cannot see the line. Identity comes from `slot`, meaning from `tone`; passing both warns
and `tone` wins, because a chart carries identity or meaning, never both.

```html
<arena-line-chart [labels]="days" [values]="latency" seriesLabel="p95 latency" [slot]="3"
                  [area]="true" />
<arena-line-chart [labels]="days" [values]="errorRate" seriesLabel="Error rate" tone="danger" />
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

`valueSuffix` is appended to the tick labels, the tooltip and the numbers table together,
so a unit written once appears everywhere. It is appended verbatim, write the space
yourself:

```html
<arena-line-chart [labels]="days" [values]="latency" seriesLabel="p95" valueSuffix=" ms" />
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
- Use `area` for a volume or a total, not for a rate. A filled area says "this much of
  something"; a rate has nothing to fill.
- Use `tone` only when the series genuinely *is* a state. A red line means "bad", and a
  red line that just means "the third series" makes the chart lie.
- Don't plot two series by stacking two line charts. One axis, one series; two series
  that share a scale need a chart Arena does not ship yet, and two that do not share one
  are two charts.
- Don't omit `labels` or `values`. Both are required inputs, Angular throws NG0950 on the
  first read rather than drawing an empty box. A chart with no data is a caller bug, not a
  state to render.
- Don't pass more `labels` than `values`. A point is drawn per value and takes the label
  at its own index, so a surplus label is silently dropped rather than drawn with no
  point above it.
- Don't express a condition as an attribute string. `area` carries the
  `booleanAttribute` transform, so a bare `area` and `[area]="true"` both mean true, and
  the one literal string `"false"` means false. Every *other* string is true, `"0"`,
  `"off"` and `"no"` all draw the fill. Bind a computed value instead:
  `[area]="isVolume"`. Keep the bare attribute for a constant true.


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
