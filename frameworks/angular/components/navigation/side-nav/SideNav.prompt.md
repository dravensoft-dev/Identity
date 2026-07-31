Arena side nav — the primary navigation landmark, and the root of a compound family that nests to
any depth. Standalone, `OnPush`, signal I/O. Styling is the sibling `SideNav.variants.ts` recipe;
the component carries no CSS classes of its own. The host **is** the landmark: `role="navigation"`,
the accessible name and the column layout all sit on it.

```html
<arena-side-nav ariaLabel="Primary" [active]="route()" (nav)="go($event)">
  <arena-side-nav-item id="projects" icon="ph-bold ph-squares-four" label="Projects" href="/projects" />
  <arena-side-nav-section label="Workspace">
    <arena-side-nav-item id="members" label="Members" href="/members" />
    <arena-side-nav-collapsible id="deploys" icon="ph-bold ph-rocket-launch" label="Deployments">
      <arena-side-nav-item id="prod" label="Production" href="/prod" />
    </arena-side-nav-collapsible>
  </arena-side-nav-section>
</arena-side-nav>
```

`ariaLabel` is **required and guarded at runtime**, because `input.required` is a compile-time
claim and a blank string satisfies it. Two navigation landmarks on one page must not share a name.

**Depth is pulled, not pushed, and that is the whole design.** React clones its children to inject
`depth + 1`; Angular has no `cloneElement`, so each container **provides** a fresh `SideNavState`
whose depth is its parent's plus one, and a row reads its own indent from the nearest ancestor
through DI. The consequence is worth knowing: **a consumer's own wrapper component between two
levels is harmless here**, where in React it breaks the injection chain outright. So is a `@for`,
and so is any depth of projection.

`indentStep` is a **number**, never a CSS string — a multiplier on `--sp-1`, not a length. A row at
depth N is padded `calc(var(--sp-1) * 3 + var(--sp-1) * indentStep * N)`, so the indent
re-densifies and re-themes with the token. `check:dimensions` cannot see this: it is a
`[style.paddingInlineStart]` binding, which is the gate's declared blind spot, and
`indentFor` is unit-tested at every depth instead.

`active` is the id of the current destination and `nav` reports the id of the row pressed. An item
with `href` keeps its **native navigation** — ctrl-click and open-in-new-tab still work — and
reports through `nav` as well; a router-driven app usually wants one or the other, not both.

**Do / Don't**
- **Do** give each row a stable `id`. `active`, `nav` and the collapsible's own auto-expansion are
  all keyed by it.
- **Do** leave `indentStep` alone unless the rail is unusually narrow. Three is the step every
  Arena sidebar uses.
- **Don't** put a heading, a divider or a search box in as a child. The family is three components
  and the landmark holds nothing else.
- **Don't** expect a treeview. Each collapsible is an independent disclosure — no `aria-level`, no
  roving tab stop, no arrow navigation — and that is refused rather than missing;
  `SideNavCollapsible.behaviour.json` states the cost.

**By hand, in real Chromium** — run `bun run demos` and open
`/frameworks/angular/components/navigation/side-nav/SideNav.card.html`:
- Each level steps in by exactly one `--sp-1 * indentStep`, and a row's icon stays aligned with its
  siblings' rather than with its parent's.
- Switching the active destination moves the ink and the weight, and opens the group holding it.
- The rail still reads at `.arena-compact`, where every indent shrinks with the token.
