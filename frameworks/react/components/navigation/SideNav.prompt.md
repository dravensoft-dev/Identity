The sidebar's navigation list — icon, label, active state. The list only: the frame
around it (brand, user footer, content area) stays the product's to compose.

```jsx
<SideNav ariaLabel="Primary" active={route} onNav={(item) => setRoute(item.id)}
  items={[
    { id: 'dashboard', icon: 'ph-bold ph-squares-four', label: 'Projects', href: '/projects' },
    { id: 'deploys',   icon: 'ph-bold ph-rocket-launch', label: 'Deployments', href: '/deploys' },
    { id: 'settings',  icon: 'ph-bold ph-gear-six', label: 'Settings' },
  ]} />
```

An item's click reports `onNav(item)` -- the item alone, with no DOM event. The anchor
still navigates natively, so ctrl-click, middle-click and open-in-new-tab keep working
for a consumer who wires nothing, but intercepting a plain click to substitute SPA
routing is no longer possible from `onNav`; do that at the router (`Link`) instead.

An item with `href` renders an `<a>`; without one it renders a `<button>`. The active
item takes `--crimson-soft` behind `--crimson` text at `--fw-semibold`; the rest are
transparent, `--mute`, `--fw-medium`. Both read `--dz-text`, so the nav re-densifies
inside `.arena-compact`.

## Do / Don't

- **Do** give every destination an `href`, even in a single-page app. It is what lets
  the item be opened in a new tab and announced as a link.
- **Do** label the nav. `ariaLabel` is required and guarded — it throws when omitted,
  because two unlabelled navs on one page are two landmarks a screen reader cannot tell
  apart, and a constant default names both of them the same thing.
- **Do** name the glyph, not the markup. `icon` is a Phosphor class name and Arena draws
  the `<i>`; the price of that convention is that an item cannot carry a consumer's own
  markup, so a row with an avatar or a two-line body has no expression here.
- **Don't** reach for `onNav` to call `preventDefault()` -- it never receives the click
  event, so it cannot stop the anchor's own navigation. Intercept at the router instead.
- **Don't** use it for tabs. `SideNav` navigates between destinations; `Tabs` changes
  the view within one, and `SegmentedControl` filters within that.
- **Don't** wrap it in your own `<nav>`. It renders one.
