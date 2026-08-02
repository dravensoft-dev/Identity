Arena side nav, the primary navigation landmark, and the root of a compound family that nests to
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

**Depth is pulled, not pushed, and that is the whole design.** Each container **provides** a
fresh `SideNavState` whose depth is its parent's plus one, and a row reads its own indent from
the nearest ancestor through DI. The consequence is worth knowing: **a consumer's own wrapper
component between two levels is harmless**, because DI walks past it, and so is a `@for`, and
so is any depth of projection. Nothing here inspects its own children, so nothing here can be
broken by what sits between them.

`indentStep` is a **number**, never a CSS string, a multiplier on `--sp-1`, not a length. A row at
depth N is padded `calc(var(--sp-1) * 3 + var(--sp-1) * indentStep * N)`, so the indent
re-densifies and re-themes with the token. `check:dimensions` cannot see this: it is a
`[style.paddingInlineStart]` binding, which is the gate's declared blind spot, and
`indentFor` is unit-tested at every depth instead.

`active` is the id of the current destination and `nav` reports the id of the row pressed. An item
with `href` splits its activations: the plain one is reported through `nav`, so
`router.navigateByUrl` in that handler is the whole bridge and nothing navigates twice, and the
rest keep working for a consumer who wires no handler.

**Do not put `routerLink` on `arena-side-nav-item`.** `RouterLink` decides whether it is on an
anchor from the host's `tagName`, and the anchor here is inside the component, so it would ignore
every modifier key and add a second tab stop over the row's own link. Navigate in `(nav)` instead.

**Do / Don't**
- **Do** give each row a stable `id`. `active`, `nav` and the collapsible's own auto-expansion are
  all keyed by it.
- **Do** leave `indentStep` alone unless the rail is unusually narrow. Three is the step every
  Arena sidebar uses.
- **Don't** put a heading, a divider or a search box in as a child. The family is three components
  and the landmark holds nothing else.
- **Don't** expect a treeview. Each collapsible is an independent disclosure, no `aria-level`, no
  roving tab stop, no arrow navigation, and that is refused rather than missing;
  `SideNavCollapsible.behaviour.json` states the cost.

### `active` is an id, and there is no route matcher

`active` names one of the ids you gave the items, and the item whose id matches is the one
marked `aria-current="page"`. It is **not** a path, and there is no `activeMatch` to say
whether it should be compared against each `href` whole or by prefix.

That was asked for and refused, and the reason is not that Arena would have to import
`@angular/router`: it would not, since a prefix comparison is arithmetic over data you pass
in. The reason is that the member would change what a *different* member means depending on
its own value, so `active` would name an id under one setting and a path under another, and
nothing could check which one a caller meant. A member that redefines its neighbour is a
member that cannot be read in isolation.

Compute the active id yourself. The `NavigationEnd` bridge that turns `router.url` into a
signal is yours in either design, because `router.url` is a property rather than a signal;
what is left is one comparison:

```ts
readonly active = computed(() => DESTINATIONS.find((d) => this.url().startsWith(d.href))?.id);
```

**By hand, in real Chromium**: run `bun run demos` and open
`/frameworks/angular/components/navigation/side-nav/SideNav.card.html`:
- Each level steps in by exactly one `--sp-1 * indentStep`, and a row's icon stays aligned with its
  siblings' rather than with its parent's.
- Switching the active destination moves the ink and the weight, and opens the group holding it.
- The rail still reads at `.arena-compact`, where every indent shrinks with the token.

### The active row is filled, and you pass one string

The item whose `id` matches `active` draws its glyph in `ph-fill`, whatever weight the string
carries. Pass `icon="ph-bold ph-house"` once per destination; do not concatenate a weight
yourself against a condition, which is Arena's own convention reimplemented in every project
that adopts it. The swap is idempotent, so passing `ph-fill` yourself changes nothing.

Every `ph-` name in this repository is checked against the installed `@phosphor-icons/web` by
`bun run check:icons`, so a typo fails the build instead of rendering an empty box. That gate
reaches Arena's tree and not yours; run the same check in your own if a wrong name would be
expensive.
