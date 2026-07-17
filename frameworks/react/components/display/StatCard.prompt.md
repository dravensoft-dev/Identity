Single metric on the card surface: uppercase label, one big tabular-nums value, an optional delta pill and a context line. Use it in a row of 2–4 for a dashboard's top band; it is not a chart and holds one number.

`value` and `delta.value` are **preformatted strings** — StatCard does no rounding, no locale, no unit. Format upstream where the units are known.

```jsx
<StatCard label="Deploys" value="128" delta={{ value: '+12%', direction: 'up', tone: 'positive' }} sub="vs last week" />
<StatCard label="p95 latency" value="340 ms" delta={{ value: '-18%', direction: 'down', tone: 'positive' }} sub="vs last week" />
<StatCard label="Open incidents" value="3" delta={{ value: '+2', direction: 'up', tone: 'negative' }} />
<StatCard label="Build time" value="4m 12s" delta={{ value: '+3s', direction: 'up' }} icon={<i className="ph-bold ph-timer" />} />
```

**Do**
- Set `tone` from what the metric *means*: latency dropping is `positive`, revenue dropping is `negative`. `direction` only draws the arrow.
- Leave `tone` off (it defaults to `neutral`) when the movement is not good or bad. A gray pill claiming nothing beats a green one claiming wrongly.
- Keep `label` to a short uppercase microlabel — it follows the same ≤2-word rule as table headers and eyebrows (H2/H6/H8).

**Don't**
- Don't assume up is good. That is the whole reason `direction` and `tone` are separate props; passing `tone: 'positive'` for every `up` re-creates the bug.
- Don't fill the delta pill. Both signs are outline: filled red is reserved for `ConfirmDialog`'s final irreversible confirmation, and a data pill has no business spending that signal.
- Don't put a sentence in `sub` — it is a short context fragment ("vs last week"), not a paragraph.
