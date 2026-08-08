Two quantities against each other, one mark per pair. The first chart here whose horizontal axis carries a value rather than a position, which is why it takes a different series type and why it names both of its axes.

```ts
readonly clouds = computed<ArenaPointSeries[]>(() => [
  { label: 'Staging', x: this.stagingLoad(), y: this.stagingLatency() },
  { label: 'Production', x: this.prodLoad(), y: this.prodLatency() },
]);
```

<!-- @api GENERATED from contracts/api/components/ArenaScatterChart.json. Edit the contract, not this table. -->

**Members**, in contract order and under this layer's own names. `*` marks a required one.

| Member | Form | Type | Default | What it is |
|---|---|---|---|---|
| `series*` | array | `readonly ArenaPointSeries[]` |  | The plotted series, drawn as one cloud of marks each. Each carries pairs rather than indexed values, because a scatter has no categories to index against: that is what ArenaPointSeries is for and why it is a separate type from ArenaSeries. The ramp clamps at its last slot rather than cycling. |
| `label*` | primitive | `string` |  | Names the chart for its accessible name and for the caption of its data table. This is the CHART's name, not a series': a series names itself. Required and guarded rather than defaulted, because a fallback of the chart TYPE satisfies roles.label mechanically and tells a screen-reader user nothing. |
| `xLabel*` | primitive | `string` |  | Names the horizontal quantity, for the accessible table's column. Required, because unlike every other chart here both axes carry a quantity a reader cannot derive: a bar chart's categories name themselves through `labels` and its value axis is the one thing being measured, while a scatter measures two things and a table of bare X and Y columns says which is which to nobody. |
| `yLabel*` | primitive | `string` |  | Names the vertical quantity, for the accessible table's column. Required for the reason xLabel is. |
| `valueSuffix` | primitive | `string` |  | Appended verbatim to every number the chart draws: both axes' ticks, the tooltip and the accessible table. Carries its own leading space if one is wanted. It reaches BOTH axes, so leave it off when the two quantities are not in the same unit, which on a scatter is the common case. |
| `valuePrefix` | primitive | `string` |  | Drawn verbatim before every number the chart writes, as valueSuffix is drawn after it, and on both axes for the same reason. |
| `valueFormat` | object | `ArenaNumberFormat` |  | How each number is written before the prefix and suffix are added: which locale, how many fraction digits, whether thousands are grouped, whether large numbers are compacted. Absent, the raw JavaScript number. |
| `height` | primitive | `number` | `280` | The plot's height in px, the --chart-height token by default. A number rather than a dimension string, because the chart does arithmetic with it to place every mark. |

<!-- @api end -->

```html
<arena-scatter-chart label="Latency against load" [series]="clouds()"
                     xLabel="Concurrent requests" yLabel="p95 latency (ms)" />
```

### Why the series type is a different one

`ArenaPointSeries` is not a variant of `ArenaSeries`, because the two disagree about what a mark
is: an `ArenaSeries` value takes its place on the axis from its index, and a pair carries both
coordinates. Folding them together would give every chart in the library a member most of them
cannot use, and would let a caller hand an indexed series to a chart with no index to read it
against.

It carries two parallel arrays rather than an array of `{ x, y }`, and that is a rule and not a
preference: a predefined object may hold an array of primitives and may not hold an array of
objects, because an array of objects reopens a nesting depth the reader has no bottom for. The
pairing by index is the same one `labels` and `values` already make on every other chart here,
and so is the rule when the two do not line up: **a mark is drawn only where both arrays have a
value**. A pair with half a coordinate is not a point, and inventing the other half is the one
thing a chart may not do.

### Both axes need naming

`xLabel` and `yLabel` are required. Every other chart here has one quantity and one set of
categories that name themselves; a scatter measures two things, and a table with bare X and Y
columns says which is which to nobody. They head the accessible table's columns and they name
the two figures in the tooltip.

`valueSuffix` and `valuePrefix` reach BOTH axes, so leave them off when the two quantities are
not in the same unit, which on a scatter is the common case.

### Reading it without a pointer

The cursor walks the marks in the order the accessible table lists them: series by series, and
within a series in the order given. That is deliberate, and it is why the two readings of this
chart agree. Walking them sorted by x was refused: it jumps between series and reads as one
sequence where there are several, and a scatter has no sequence of its own.

ArrowLeft and ArrowRight move it, Home and End jump to the ends, Escape clears it. The vertical
pair does nothing and is not consumed, so the page keeps its own scroll.
