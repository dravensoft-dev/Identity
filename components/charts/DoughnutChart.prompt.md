Parts of one whole — a share breakdown across a handful of categories. Always draws a legend with the label and value beside each swatch: the slices are the series, and identity is never carried by color alone. Hovering a slice or a legend row highlights both and shows the share in the hole.

```jsx
<ChartCard title="Traffic by service">
  <DoughnutChart labels={['Web','API','Worker','Static']} values={[420,310,140,90]}
    valueFormatter={(v) => `${v} rps`} />
</ChartCard>
```

**Do**
- Keep it to a handful of slices. Past five or six, the small ones are unreadable — fold the tail into "Other", or use bars.
- Let `slots` default. Slots 1..N in order is the rule, not a starting point to tweak.
- Use it only when the parts genuinely sum to one whole. If they don't, it is a bar chart.

**Don't**
- Don't reach for `tone` — it doesn't exist here. Slices are categories by definition; a doughnut has no state to report.
- Don't go past eight categories. The ramp is eight slots and is never cycled: a ninth slice would repeat slot 1 and claim two categories are one.
- Don't compare two doughnuts side by side. Reading angle differences across charts is the thing people are worst at; use grouped bars.
