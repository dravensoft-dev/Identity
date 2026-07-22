Arena metric tile. A mono micro-label, the number in display weight, and an optional
delta pill. Two tone dimensions answer two different questions about the same
number, and neither implies the other:

- `tone` says what state the number **IS in right now** — colors the value itself.
  A service at 99.98% uptime is healthy whether or not it improved this week, and
  two open incidents are two open incidents even when that is down from five.
- `deltaTone` says whether the number's last change was **good**; `deltaDirection`
  says which way it pointed — colors the delta pill. Revenue down is bad, latency
  down is good, and the tile cannot know which metric it is showing.

A tile can legitimately show `tone="danger"` with `deltaTone="positive"` in the
same breath — a bad state that is improving is still a bad state. Styling is the
sibling `stat-card.variants.ts` recipe.

```html
<arena-stat-card label="Revenue" value="$48.2k" deltaValue="12%" deltaTone="positive" />
<arena-stat-card label="p95 latency" value="184ms" deltaValue="9%" deltaDirection="down" deltaTone="positive" />
<arena-stat-card label="Open incidents" value="3" tone="danger" deltaValue="2" deltaTone="positive" sub="2 acknowledged" />
```

**Do / Don't**
- Set `deltaTone` deliberately for every delta. The default is neutral, and a neutral
  delta on a metric where the direction matters is a missed signal, not a safe one.
- Set `tone` for what the number currently IS, not for how it moved — reach for
  `deltaTone`/`deltaDirection` for that instead. Conflating the two loses the
  distinction that "Open incidents" above depends on: the value stays `danger`
  red while the pill still reads a positive green improvement.
- Don't fill the negative delta or the danger value. Both are text/outline in
  `--error` — the value slot carries no background at all, and the delta pill is
  `bg-transparent` — like every other danger surface in Arena except
  `ConfirmDialog`'s final confirmation.
- Don't put a chart in a stat card — `arena-chart-card` is the tile that holds one.
