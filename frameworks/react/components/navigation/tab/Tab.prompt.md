One tab in a `Tabs` strip, and the panel it shows. The tab draws the button; its children fill the
panel `Tabs` renders below the strip.

```jsx
<Tabs defaultValue="overview" onChange={setView}>
  <Tab value="overview" label="Overview"><ServiceHealth /></Tab>
  <Tab value="activity" label="Activity"><ActivityFeed items={items} /></Tab>
</Tabs>
```

**Do / Don't**
- Do give every tab a `value` and a `label`. Both are required and both are guarded: a blank one
  throws rather than drawing a nameless tab.
- Do write tabs as siblings or in an array. Don't wrap them in a fragment or in a component of your
  own, `React.Children.toArray` cannot see through either, so `Tabs` would have nothing to inject
  into and the strip would render inert.
- Don't render the panel yourself. `Tabs` draws exactly one, wired to the selected tab; a second
  one would be a panel no tab controls.
- Don't reach for `style`. It takes none.
