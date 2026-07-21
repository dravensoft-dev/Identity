Arena metric tile. A mono micro-label, the number in display weight, and an optional
delta pill. `deltaTone` says whether the change is **good**; `deltaDirection` says
which way it points. They are separate inputs because they are separate facts —
revenue down is bad, latency down is good, and the tile cannot know which metric it
is showing. Styling is the sibling `stat-card.variants.ts` recipe.

```html
<arena-stat-card label="Revenue" value="$48.2k" deltaValue="12%" deltaTone="positive" />
<arena-stat-card label="p95 latency" value="184ms" deltaValue="9%" deltaDirection="down" deltaTone="positive" />
<arena-stat-card label="Open incidents" value="3" deltaValue="2" deltaTone="negative" sub="since Friday" />
```

**Do / Don't**
- Set `deltaTone` deliberately for every delta. The default is neutral, and a neutral
  delta on a metric where the direction matters is a missed signal, not a safe one.
- Don't fill the negative delta. It is an outline pill in `--error`, like every other
  danger surface in Arena except `ConfirmDialog`'s final confirmation.
- Don't put a chart in a stat card — `arena-chart-card` is the tile that holds one.
