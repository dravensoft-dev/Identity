The card a chart sits on: an uppercase muted microlabel, optional actions on the right, and the chart itself. Arena's charts are hand-written SVG with no dependency — they read the ramp tokens directly, so they re-theme with the page and need no configuration to do it.

```jsx
<ChartCard title="Deploys per day">
  <BarChart labels={['Mon','Tue','Wed','Thu','Fri']} values={[12,19,9,22,17]} seriesLabel="Deploys" />
</ChartCard>

<ChartCard title="p95 latency" actions={<Select size="sm" options={ranges} />}>
  <LineChart labels={days} values={latency} seriesLabel="ms" slot={5} area />
</ChartCard>
```

**Do**
- Let `title` name the series when there is only one — that is why a single-series chart draws no legend box.
- Keep `title` to a short uppercase microlabel, like every other label in Arena (H2/H6/H8).
- Put the range picker or the export button in `actions`, not above the card.

**Don't**
- Don't pass a heading into `title` expecting an `h2` — it renders a label on purpose. A dashboard is a grid of tiles, not a document outline.
- Don't nest a `ChartCard` inside a `Card`. It *is* the card surface; nesting doubles the border and the padding.
