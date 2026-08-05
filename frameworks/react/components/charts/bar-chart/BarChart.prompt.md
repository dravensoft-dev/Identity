Bars for comparing a value across categories. Dependency-free SVG: it reads `var(--color-cat-N)` directly, so it re-themes with the page for free. Hover gives a per-bar tooltip; the numbers are also exposed as a table for screen readers.

```tsx
{/* identity: the default, one color for the whole series */}
<BarChart labels={['Mon','Tue','Wed','Thu','Fri']} values={[12,19,9,22,17]} seriesLabel="Deploys" />

{/* identity: per-bar, when the bars are different things */}
<BarChart labels={['Web','API','Worker']} values={[24,18,7]} slots={[1,2,3]} seriesLabel="Services" />

{/* meaning: the series IS a state */}
<BarChart labels={['Mon','Tue','Wed']} values={[2,5,1]} tone="danger" seriesLabel="Failed builds"
  valueSuffix=" builds" />
```

<!-- @api GENERATED from contracts/api/components/BarChart.json. Edit the contract, not this table. -->

**Members**, in contract order and under this layer's own names. `*` marks a required one.

| Member | Form | Type | Default | What it is |
|---|---|---|---|---|
| `labels*` | array | `readonly string[]` |  | One label per bar, in the same order as `values`. A label with no value at its index is dropped. |
| `values*` | array | `readonly number[]` |  | The plotted data. One bar per entry; a negative value clamps to the baseline. |
| `seriesLabel*` | primitive | `string` |  | Names the series for the accessible name, the table caption and its value column. Required and guarded rather than defaulted: a fallback of the chart TYPE satisfies roles.label mechanically and tells a screen-reader user nothing, so two charts on one page announce identically. Nothing can derive it -- what a series is about is editorial, the same reason Table.label is required. |
| `slot` | primitive | `number` | `1` | One identity colour from the categorical ramp for the whole series. 1-based, clamped to the ramp, never cycled. |
| `slots` | array | `readonly number[]` |  | Per-bar identity override, one ramp slot each. Wins over `slot`. |
| `tone` | enum | `ArenaSeriesTone` |  | Semantic colour, for a series that IS a state. Mutually exclusive with slot/slots; passing both warns in development and tone wins. |
| `valueSuffix` | primitive | `string` |  | Appended verbatim to every number the chart draws: the axis ticks, the tooltip and the accessible table. Carries its own leading space if one is wanted. |
| `valuePrefix` | primitive | `string` |  | Drawn verbatim before every number the chart writes, as valueSuffix is drawn after it. A currency that precedes its amount is the majority case worldwide and had no expression: with suffix alone, "1234.5 Bs." is what a chart drew where the table beside it read "Bs. 1.234,50", and the accessible table inherited the disagreement. |
| `valueFormat` | object | `ArenaNumberFormat` |  | How each number is written before the prefix and suffix are added: which locale, how many fraction digits, whether thousands are grouped, whether large numbers are compacted. Absent, the raw JavaScript number, which is what this chart drew before the member existed. |
| `height` | primitive | `number` | `280` | The plot's height in px, the --chart-height token by default. A number rather than a dimension string, because the chart does arithmetic with it to place every mark, and a caller-supplied "20rem" is neither a token nor a derivation of one. |
| `minPointSpacing` | primitive | `number` |  | The narrowest gap, in px, the chart draws between two adjacent points. Below it the chart stops compressing and overflows its container horizontally instead, scrolled and anchored to the most recent point: marker spacing is a legibility constant, not something that yields to the viewport, and thirty days in 390px is unreadable at any font size. Absent, the chart fits whatever width it is given. The rail it scrolls in is a keyboard-reachable region, because an overflow box nothing can focus is a trap. |

<!-- @api end -->

**Do**
- Default to one identity color for the series. Per-bar `slots` is for when each bar is genuinely a different thing, not for decoration.
- Assign slots in order (1, 2, 3) and let a ninth category fold into "Other". The ramp is eight slots and is never cycled.
- Reach for `tone` only when the series *is* a state: failed builds, error rate. That is what makes red mean red.
- Pass `valueSuffix` for units: the axis, the tooltip and the accessible table all carry it. It is appended verbatim, so write the space yourself: `" ms"`, but `"%"`.

**Don't**
- Don't pass `tone` together with `slot`/`slots`. A chart carries identity or meaning, never both; it warns in development and `tone` wins.
- Don't use status colors as series colors by hand. A series painted `--danger` reads as an error, and that is exactly the bug this API exists to prevent.
- Don't reach past eight categories. Nine bars in eight slots means two of them lie about being the same.
- Don't add a second axis. Arena charts have one; a dual axis invents a correlation the data never claimed.
- Use `valuePrefix` for a currency that goes in front, and `valueFormat` for the number itself: locale, fraction digits, grouping, compaction. Formatting before you pass them is not an option, because what you pass is `number[]` and the writing happens on labels Arena generates afterwards. With no `valueFormat` the raw JavaScript number is drawn, which is what a chart always did.
- Don't omit `labels` or `values`. Both are required props, `BarChart` throws from its render rather than drawing an empty box. A required member absent is a caller bug that fails hard in every layer, not a state to render.
- Don't pass more `labels` than `values`. A bar is drawn per value and takes the label at its own index, so a surplus label is silently dropped rather than drawn without a bar to sit under.


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
