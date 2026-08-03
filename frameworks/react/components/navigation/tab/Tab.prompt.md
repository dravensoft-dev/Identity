One tab in a `Tabs` strip, and the panel it shows. The tab draws the button; its children fill the
panel `Tabs` renders below the strip.

```tsx
<Tabs defaultValue="overview" onChange={setView}>
  <Tab value="overview" label="Overview"><ServiceHealth /></Tab>
  <Tab value="activity" label="Activity"><ActivityFeed items={items} /></Tab>
</Tabs>
```

<!-- @api GENERATED from contracts/api/components/Tab.json. Edit the contract, not this table. -->

**Members**, in contract order and under this layer's own names. `*` marks a required one.

| Member | Form | Type | Default | What it is |
|---|---|---|---|---|
| `value*` | primitive | `string` |  | What this tab selects, and what the parent's `change` carries. |
| `label*` | primitive | `string` |  | What the tab reads. Arena draws the button; the consumer names it. |
| `children` | slot |  |  | What the panel shows while this tab is selected. Tabs places it; Tab never renders it, because a tabpanel may not sit inside a tablist. |

<!-- @api end -->

**Do / Don't**
- Do give every tab a `value` and a `label`. Both are required and both are guarded: a blank one
  throws rather than drawing a nameless tab.
- Do write tabs as siblings or in an array. Don't wrap them in a fragment or in a component of your
  own, `React.Children.toArray` cannot see through either, so `Tabs` would have nothing to inject
  into and the strip would render inert.
- Don't render the panel yourself. `Tabs` draws exactly one, wired to the selected tab; a second
  one would be a panel no tab controls.
- Don't reach for `style`. It takes none.
