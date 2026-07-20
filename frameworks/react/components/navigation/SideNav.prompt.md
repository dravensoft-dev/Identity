The sidebar's navigation list — icon, label, active state. The list only: the frame
around it (brand, user footer, content area) stays the product's to compose.

```jsx
<SideNav ariaLabel="Primary" active={route} onNav={setRoute}
  items={[
    { id: 'dashboard', icon: <Icon name="grid" />, label: 'Projects', href: '/projects' },
    { id: 'deploys',   icon: <Icon name="rocket" />, label: 'Deployments', href: '/deploys' },
    { id: 'settings',  icon: <Icon name="gear" />,  label: 'Settings' },
  ]} />
```

An item with `href` renders an `<a>`; without one it renders a `<button>`. The active
item takes `--crimson-soft` behind `--crimson` text at `--fw-semibold`; the rest are
transparent, `--mute`, `--fw-medium`. Both read `--dz-text`, so the nav re-densifies
inside `.arena-compact`.

## Do / Don't

- **Do** give every destination an `href`, even in a single-page app. It is what lets
  the item be opened in a new tab and announced as a link.
- **Do** label the nav. `ariaLabel` names the landmark, and two unlabelled navs on one
  page are two landmarks a screen reader cannot tell apart.
- **Don't** pass an icon name. `icon` is a node — the library ships no `Icon`, and
  taking a string would couple this component to one that does not exist.
- **Don't** use it for tabs. `SideNav` navigates between destinations; `Tabs` changes
  the view within one, and `SegmentedControl` filters within that.
- **Don't** wrap it in your own `<nav>`. It renders one.
