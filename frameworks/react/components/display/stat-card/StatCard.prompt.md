Single metric on the card surface: uppercase label, one big tabular-nums value, an optional delta pill and a context line. Use it in a row of 2–4 for a dashboard's top band; it is not a chart and holds one number.

`label` and `value` are required. `delta` is optional, and the pill renders only when
`delta.value` is truthy — a `delta` object carrying a `tone`/`direction` but an empty
`value` renders nothing at all, matching Angular's `arena-stat-card` exactly (both layers
gate on the same fact, per `api/components/StatCard.json`).

`value` and `delta.value` are **preformatted strings** — StatCard does no rounding, no locale, no unit. Format upstream where the units are known.

```jsx
<StatCard label="Deploys" value="128" delta={{ value: '+12%', direction: 'up', tone: 'positive' }} sub="vs last week" />
<StatCard label="p95 latency" value="340 ms" delta={{ value: '-18%', direction: 'down', tone: 'positive' }} sub="vs last week" />
<StatCard label="Open incidents" value="3" delta={{ value: '+2', direction: 'up', tone: 'negative' }} />
<StatCard label="Build time" value="4m 12s" delta={{ value: '+3s', direction: 'up' }} icon="ph-bold ph-timer" />
```

`tone` on the card colors the **value**; `delta.tone` colors the **pill**. They answer different questions — what the number *is* versus how it *moved* — and either can be set without the other:

```jsx
<StatCard label="Average uptime" value="99.98%" tone="success" />
<StatCard label="Incidents" value="2" tone="danger" />
<StatCard label="Error rate" value="0.02%" tone="gold" sub="within budget" />
```

**Do**
- Set `tone` from what the metric *means*: latency dropping is `positive`, revenue dropping is `negative`. `direction` only draws the arrow.
- Reach for the card's `tone` only when the value's current state is the point. A row where every number is colored says nothing — the color has to be scarce to read as a signal, and a band of four black numbers with one red one is the whole design.
- Leave `tone` off (it defaults to `neutral`) when the movement is not good or bad. A gray pill claiming nothing beats a green one claiming wrongly.
- Keep `label` to a short uppercase microlabel — it follows the same ≤2-word rule as table headers and eyebrows (H2/H6/H8).

**Don't**
- Don't assume up is good. That is the whole reason `direction` and `tone` are separate props; passing `tone: 'positive'` for every `up` re-creates the bug.
- Don't fill the delta pill. Both signs are outline: filled red is reserved for `ConfirmDialog`'s final irreversible confirmation, and a data pill has no business spending that signal.
- Don't put a sentence in `sub` — it is a short context fragment ("vs last week"), not a paragraph.
- Don't use the card's `tone` to restate the delta. If the pill already says the movement was bad, coloring the value red says it twice and leaves you nothing to say when the *state* turns bad too.
