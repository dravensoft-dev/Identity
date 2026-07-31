One destination in a `SideNav`. Write one per destination, as a direct child.

```jsx
<SideNav ariaLabel="Primary" active={route} onNav={(id) => setRoute(id)}>
  <SideNavItem id="projects" icon="ph-bold ph-squares-four" label="Projects" href="/projects" />
  <SideNavItem id="filters" label="Filters" />
</SideNav>
```

`href` decides which element the item renders, so it is the field to read first:
present ⇒ an `<a>`, absent ⇒ a `<button>`. The active item — the one whose `id`
matches `SideNav.active` — takes `aria-current="page"`, `--crimson-soft` behind
`--crimson` text at `--fw-semibold`; the rest are transparent, `--mute`,
`--fw-medium`. Everything about *where* the item sits — its nesting depth, which id
is active, the indent step and the handler that reports `nav` — is injected by
`SideNav` and is not part of this component's API. You never write those.

## Do / Don't

- **Do** give it an `id` and a `label`. Both are required and both are guarded against
  a *blank* value as well as an absent one: `label` is the link's whole accessible
  name, and a blank `id` can never match `active`, so it is an omission wearing a value.
- **Do** give it an `href` when it navigates, even in a single-page app. It is what
  lets the destination be opened in a new tab, copied, and announced as a link. An
  item that only changes local state is correctly a `<button>`.
- **Do** name the glyph, not the markup. `icon` is a Phosphor class name and Arena
  draws the `<i>`.
- **Don't** expect to put your own markup inside one. The single-icon convention's
  stated price is exactly this: an item is an icon and a label, so a row with an
  avatar, a badge or a two-line body has no expression here.
- **Don't** wrap items in a fragment. Arena injects into the children it is handed,
  and `React.Children.toArray` does not see through a `<>…</>` — write them as
  siblings, or in an array. A wrapper component of your own has the same effect, and
  it is the same limit `Table` and `RadioGroup` already carry.
- **Don't** render one outside a `SideNav`. It renders, but nothing injects the active
  id or the handler, so it is a link that reports nothing and never marks itself current.

- **`disabled` draws the destination and refuses it.** It reflects through `aria-disabled` rather
  than by not rendering the item: an unavailable destination a user can see, and hear announced as
  unavailable, is what tells them it exists — a feature behind a plan they do not have is worth
  showing. The anchor keeps its `href`, so the shape does not change; what changes is that the
  click is prevented and `onActivate` never fires.
