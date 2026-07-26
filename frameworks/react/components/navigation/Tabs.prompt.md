A row of tabs and the one panel they switch between. The active tab has a crimson underline.

```jsx
<Tabs defaultValue="overview" onChange={setView}>
  <Tab value="overview" label="Overview"><ServiceHealth /></Tab>
  <Tab value="deployments" label="Deployments"><DeployTable /></Tab>
</Tabs>
```

**Do / Don't**
- Do write one `<Tab>` per view, with that view as its children. The `tabs` array is gone, and so is
  the `TabItem` type it used — a tab is a component now, so its panel can be your own markup.
- Do write tabs as siblings or in an array. Don't wrap them in a fragment or a component of your
  own: `React.Children.toArray` cannot see through either, so nothing would be injected and the
  strip would render inert.
- Don't render your own panel, and don't switch on the value yourself. Arena renders one tabpanel
  per tab and shows exactly one of them; a panel of your own is a panel no tab controls.
- **Do expect every tab's content to mount immediately.** Arena renders all the panels and hides the
  inactive ones, because the `tabs` pattern requires *each* tab to have an `aria-controls`
  referencing its tabpanel, and a reference to an id nothing renders is not a reference. So a
  panel's effects run on mount, not on first selection.
- **Don't put a cost you only want to pay on selection inside a `<Tab>`'s children** — a fetch, a
  chart that measures itself, a subscription. Guard it on the value you already have from
  `onChange`, or render that view's body only once its tab has been chosen. Arena cannot make this
  decision for you: deferring the mount is what dangles the other tabs' `aria-controls`.
- Don't reach for `style` to space the strip. It takes none — the panel already carries the gap
  below the underline.

**Checked by hand, because a suite cannot hold it:** happy-dom has no sequential focus navigation,
so nothing asserts that Tab from a tab reaches the panel rather than the next tab. Serve the tree
with `bun run demos`, open `navigation.card.html`, and check it in a real browser.
