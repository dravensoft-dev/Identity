The sidebar's navigation list: icon, label, active state. The list only: the frame
around it (brand, user footer, content area) stays the product's to compose.

A **compound** component. You write one `<SideNavItem>` per destination; `SideNav`
walks its direct children and injects where each sits, which `id` is active and the
handler that reports `nav`. None of what it injects is a member of any contract,
the same shape as `Table`/`TableRow` and `RadioGroup`/`Radio`, one size down.

```tsx
<SideNav ariaLabel="Primary" active={route} onNav={(id) => setRoute(id)}>
  <SideNavItem id="dashboard" icon="ph-bold ph-squares-four" label="Projects" href="/projects" />
  <SideNavItem id="deploys" icon="ph-bold ph-rocket-launch" label="Deployments" href="/deploys" />
  <SideNavItem id="settings" icon="ph-bold ph-gear-six" label="Settings" />
</SideNav>
```

An item's click reports `onNav(id)` -- the activated item's `id`, with no DOM event.
There is no item datum to carry: you wrote the element, so you already hold
everything on it. An item with `href` splits its activations: the plain one is reported
through `onNav`, so routing from there does not race the browser, and the rest keep working
for a consumer who wires no handler.

An item with `href` renders an `<a>`; without one it renders a `<button>`. The active
item takes `--crimson-soft` behind `--crimson` text at `--fw-semibold`; the rest are
transparent, `--mute`, `--fw-medium`. Both read `--dz-text`, so the nav re-densifies
inside `.arena-compact`.

Group related items with `<SideNavSection label="Workspace">…</SideNavSection>`. Each
nesting level indents one step deeper, and `indentStep` (default `3`) is the multiplier of
`--sp-1` that step applies -- a caller can only widen or narrow the multiplier, never
supply a length of their own, so the indent keeps re-densifying inside `.arena-compact` no
matter how far it is nested.

```tsx
<SideNav ariaLabel="Primary" active={route} onNav={(id) => setRoute(id)}>
  <SideNavItem id="dashboard" icon="ph-bold ph-squares-four" label="Projects" href="/projects" />
  <SideNavSection label="Workspace">
    <SideNavItem id="deploys" icon="ph-bold ph-rocket-launch" label="Deployments" href="/deploys" />
    <SideNavItem id="settings" icon="ph-bold ph-gear-six" label="Settings" />
  </SideNavSection>
</SideNav>
```

Hide a group behind a toggle with
`<SideNavCollapsible id="deploys" label="Deployments">…</SideNavCollapsible>`. It is a real
`<button>` carrying `aria-expanded` and an `aria-controls` naming the region under it -- the
`disclosure` pattern, deliberately not a treeview -- and it **opens itself when the subtree
it holds contains `active`**, on the first render and on every later route change into it.
That saves you computing `defaultExpanded` from the route, and `onToggle` stays silent for
it, because the automatic expansion is Arena's decision rather than the user's. See
`SideNavCollapsible.prompt.md`.

```tsx
<SideNav ariaLabel="Primary" active={route} onNav={(id) => setRoute(id)}>
  <SideNavItem id="dashboard" icon="ph-bold ph-squares-four" label="Projects" href="/projects" />
  <SideNavSection label="Workspace">
    <SideNavCollapsible id="deploys" icon="ph-bold ph-rocket-launch" label="Deployments">
      <SideNavItem id="prod" label="Production" href="/deploys/prod" />
      <SideNavItem id="staging" label="Staging" href="/deploys/staging" />
    </SideNavCollapsible>
  </SideNavSection>
</SideNav>
```

## Do / Don't

- **Do** give every destination an `href`, even in a single-page app. It is what lets
  the item be opened in a new tab and announced as a link.
- **Do** label the nav. `ariaLabel` is required and guarded; it throws when omitted
  *and when blank*, because two unlabelled navs on one page are two landmarks a screen
  reader cannot tell apart, and a constant default names both of them the same thing.
- **Do** write the items yourself. A `SideNav` with no children is a legal empty
  landmark, not an error: "no destinations right now" is a thing a caller can mean.
- **Don't** wrap items in a fragment. Arena injects into the children it is handed,
  and `React.Children.toArray` does not see through a `<>…</>`; write them as
  siblings, or in an array. A wrapper component of your own has the same effect, and
  it is the same limit `Table` and `RadioGroup` already carry.
- **Don't** reach for `onNav` to call `preventDefault()` -- it never receives the click
  event, and it does not need to: Arena has already cancelled the anchor by the time it fires.
- **Don't** wrap an item in your router's `Link`. The anchor is Arena's and is already
  inside the item; navigate in `onNav`.
- **Don't** use it for tabs. `SideNav` navigates between destinations; `Tabs` changes
  the view within one, and `SegmentedControl` filters within that.
- **Don't** wrap it in your own `<nav>`. It renders one.
- **Don't** pass `indentStep` a length string. It is a multiplier of `--sp-1`, never a CSS
  length -- a value like `"1.5rem"` is neither a token nor a derivation of one, and it
  would stop re-densifying inside `.arena-compact` with no gate to catch it.

### `active` is an id, and there is no route matcher

`active` names one of the ids you gave the items, and the item whose id matches is the one
marked `aria-current="page"`. It is **not** a path, and there is no `activeMatch` to say
whether it should be compared against each `href` whole or by prefix.

That was asked for and refused, and the reason is not that Arena would have to import a
router: it would not, since a prefix comparison is arithmetic over data you pass in. The
reason is that the member would change what a *different* member means depending on its own
value, so `active` would name an id under one setting and a path under another, and nothing
could check which one a caller meant. A member that redefines its neighbour is a member that
cannot be read in isolation.

Compute the active id yourself. Whatever bridges your router to a signal or to state is
yours in either design; what is left is one comparison:

```tsx
const active = DESTINATIONS.find((d) => pathname.startsWith(d.href))?.id;
```

### The active row is filled, and you pass one string

The item whose `id` matches `active` draws its glyph in `ph-fill`, whatever weight the string
carries. Pass `icon="ph-bold ph-house"` once per destination; do not concatenate a weight
yourself against a condition, which is Arena's own convention reimplemented in every project
that adopts it. The swap is idempotent, so passing `ph-fill` yourself changes nothing.

Every `ph-` name in this repository is checked against the installed `@phosphor-icons/web` by
`bun run check:icons`, so a typo fails the build instead of rendering an empty box. That gate
reaches Arena's tree and not yours; run the same check in your own if a wrong name would be
expensive.
