Parts of one whole — a share breakdown across a handful of categories. Always draws a legend with the label and value beside each swatch: the slices are the series, and identity is never carried by color alone. Hovering a slice or a legend row highlights both and shows the share in the hole.

```jsx
<ChartCard title="Traffic by service">
  <DoughnutChart labels={['Web','API','Worker','Static']} values={[420,310,140,90]}
    seriesLabel="Traffic" valueSuffix=" rps" />
</ChartCard>
```

**Do**
- Keep it to a handful of slices. Past five or six, the small ones are unreadable — fold the tail into "Other", or use bars.
- Let `slots` default. Slots 1..N in order is the rule, not a starting point to tweak.
- Use it only when the parts genuinely sum to one whole. If they don't, it is a bar chart.
- Pass `seriesLabel` — it names the chart for a screen reader, titles the numbers table and names its value column. Without it the chart announces as "Doughnut chart", which identifies the chart *type* and not the chart.
- Pass `valueSuffix` for units. It reaches the legend and the accessible table, and never the centre percentage.

**Don't**
- Don't reach for `tone` — it doesn't exist here. Slices are categories by definition; a doughnut has no state to report.
- Don't expect `valueSuffix` to format. It appends a unit and nothing else — no rounding, no thousands separator, no currency. Format the numbers before you pass them.
- Don't go past eight categories. The ramp is eight slots and is never cycled: a ninth slice would repeat slot 1 and claim two categories are one.
- Don't compare two doughnuts side by side. Reading angle differences across charts is the thing people are worst at; use grouped bars.
- Don't pass more `labels` than `values`. A slice is drawn per value and takes the label at its own index, so a surplus label is silently dropped rather than given a legend row with no slice behind it.
