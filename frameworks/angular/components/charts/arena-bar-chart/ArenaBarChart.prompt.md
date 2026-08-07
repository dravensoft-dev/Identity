Arena bar chart. One axis, hand-written SVG, every colour a token, so it re-themes
with the rest of Arena and costs no dependency. Identity comes from `slot` (one colour
for the series) or `slots` (a colour per bar, **in ramp order, never cycled**); meaning
comes from `tone`. Passing both warns and `tone` wins, because a chart carries identity
or meaning, never both.

```html
<arena-bar-chart [labels]="weeks" [values]="counts" seriesLabel="Deployments" [slot]="1" />
<arena-bar-chart [labels]="services" [values]="errors" seriesLabel="Errors" tone="danger" />
```

<!-- @api GENERATED from contracts/api/components/ArenaBarChart.json. Edit the contract, not this table. -->

**Members**, in contract order and under this layer's own names. `*` marks a required one.

| Member | Form | Type | Default | What it is |
|---|---|---|---|---|
| `labels*` | array | `readonly string[]` |  | One label per bar, in the same order as `values`. A label with no value at its index is dropped. |
| `values*` | array | `readonly number[]` |  | The plotted data. One bar per entry. A negative value grows downward from the zero line, which the axis places on a tick rather than at the plot's foot; the rounded end of a bar is always its data end. |
| `seriesLabel*` | primitive | `string` |  | Names the series for the accessible name, the table caption and its value column. Required and guarded rather than defaulted: a fallback of the chart TYPE satisfies roles.label mechanically and tells a screen-reader user nothing, so two charts on one page announce identically. Nothing can derive it -- what a series is about is editorial, the same reason ArenaTable.label is required. |
| `slot` | primitive | `number` | `1` | One identity colour from the categorical ramp for the whole series. 1-based, clamped to the ramp, never cycled. |
| `slots` | array | `readonly number[]` |  | Per-bar identity override, one ramp slot each. Wins over `slot`. |
| `tone` | enum | `ArenaSeriesTone` |  | Semantic colour, for a series that IS a state. Mutually exclusive with slot/slots; passing both warns in development and tone wins. |
| `valueSuffix` | primitive | `string` |  | Appended verbatim to every number the chart draws: the axis arenaTicks, the tooltip and the accessible table. Carries its own leading space if one is wanted. |
| `valuePrefix` | primitive | `string` |  | Drawn verbatim before every number the chart writes, as valueSuffix is drawn after it. A currency that precedes its amount is the majority case worldwide and had no expression: with suffix alone, "1234.5 Bs." is what a chart drew where the table beside it read "Bs. 1.234,50", and the accessible table inherited the disagreement. |
| `valueFormat` | object | `ArenaNumberFormat` |  | How each number is written before the prefix and suffix are added: which locale, how many fraction digits, whether thousands are grouped, whether large numbers are compacted. Absent, the raw JavaScript number, which is what this chart drew before the member existed. |
| `height` | primitive | `number` | `280` | The plot's height in px, the --chart-height token by default. A number rather than a dimension string, because the chart does arithmetic with it to place every mark, and a caller-supplied "20rem" is neither a token nor a derivation of one. |
| `minPointSpacing` | primitive | `number` |  | The narrowest gap, in px, the chart draws between two adjacent points. Below it the chart stops compressing and overflows its container horizontally instead, scrolled and anchored to the most recent point: marker spacing is a legibility constant, not something that yields to the viewport, and thirty days in 390px is unreadable at any font size. Absent, the chart fits whatever width it is given. The rail it scrolls in is a keyboard-reachable region, because an overflow box nothing can focus is a trap. |

<!-- @api end -->

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
