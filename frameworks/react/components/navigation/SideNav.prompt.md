The sidebar's navigation list — icon, label, active state. The list only: the frame
around it (brand, user footer, content area) stays the product's to compose.

A **compound** component. You write one `<SideNavItem>` per destination; `SideNav`
walks its direct children and injects where each sits, which `id` is active and the
handler that reports `onNav`. None of what it injects is a member of any contract —
the same shape as `Table`/`TableRow` and `RadioGroup`/`Radio`, one size down.

```jsx
<SideNav ariaLabel="Primary" active={route} onNav={(id) => setRoute(id)}>
  <SideNavItem id="dashboard" icon="ph-bold ph-squares-four" label="Projects" href="/projects" />
  <SideNavItem id="deploys" icon="ph-bold ph-rocket-launch" label="Deployments" href="/deploys" />
  <SideNavItem id="settings" icon="ph-bold ph-gear-six" label="Settings" />
</SideNav>
```

An item's click reports `onNav(id)` -- the activated item's `id`, with no DOM event.
There is no item datum to carry: you wrote the element, so you already hold
everything on it. The anchor still navigates natively, so ctrl-click, middle-click
and open-in-new-tab keep working for a consumer who wires nothing, but intercepting
a plain click to substitute SPA routing is not possible from `onNav`; do that at the
router (`Link`) instead.

An item with `href` renders an `<a>`; without one it renders a `<button>`. The active
item takes `--crimson-soft` behind `--crimson` text at `--fw-semibold`; the rest are
transparent, `--mute`, `--fw-medium`. Both read `--dz-text`, so the nav re-densifies
inside `.arena-compact`.

Group related items with `<SideNavSection label="Workspace">…</SideNavSection>`. Each
nesting level indents one step deeper, and `indentStep` (default `3`) is the multiplier of
`--sp-1` that step applies -- a caller can only widen or narrow the multiplier, never
supply a length of their own, so the indent keeps re-densifying inside `.arena-compact` no
matter how far it is nested.

```jsx
<SideNav ariaLabel="Primary" active={route} onNav={(id) => setRoute(id)}>
  <SideNavItem id="dashboard" icon="ph-bold ph-squares-four" label="Projects" href="/projects" />
  <SideNavSection label="Workspace">
    <SideNavItem id="deploys" icon="ph-bold ph-rocket-launch" label="Deployments" href="/deploys" />
    <SideNavItem id="settings" icon="ph-bold ph-gear-six" label="Settings" />
  </SideNavSection>
</SideNav>
```

## Do / Don't

- **Do** give every destination an `href`, even in a single-page app. It is what lets
  the item be opened in a new tab and announced as a link.
- **Do** label the nav. `ariaLabel` is required and guarded — it throws when omitted
  *and when blank*, because two unlabelled navs on one page are two landmarks a screen
  reader cannot tell apart, and a constant default names both of them the same thing.
- **Do** write the items yourself. A `SideNav` with no children is a legal empty
  landmark, not an error — "no destinations right now" is a thing a caller can mean.
- **Don't** wrap items in a fragment. Arena injects into the children it is handed,
  and `React.Children.toArray` does not see through a `<>…</>` — write them as
  siblings, or in an array. A wrapper component of your own has the same effect, and
  it is the same limit `Table` and `RadioGroup` already carry.
- **Don't** reach for `onNav` to call `preventDefault()` -- it never receives the click
  event, so it cannot stop the anchor's own navigation. Intercept at the router instead.
- **Don't** use it for tabs. `SideNav` navigates between destinations; `Tabs` changes
  the view within one, and `SegmentedControl` filters within that.
- **Don't** wrap it in your own `<nav>`. It renders one.
- **Don't** pass `indentStep` a length string. It is a multiplier of `--sp-1`, never a CSS
  length -- a value like `"1.5rem"` is neither a token nor a derivation of one, and it
  would stop re-densifying inside `.arena-compact` with no gate to catch it.
