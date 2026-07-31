Arena side-nav item — one destination in an `arena-side-nav`. Standalone, `OnPush`, signal I/O.
Styling is the family's shared `SideNav.variants.ts` recipe. The host declares `display: contents`
and the row itself is a real `<a>` or a real `<button>`, so the browser's own activation,
navigation and focus semantics are never re-implemented.

```html
<arena-side-nav-item id="projects" icon="ph-bold ph-squares-four" label="Projects" href="/projects" />
<arena-side-nav-item id="settings" icon="ph-bold ph-gear-six" label="Settings" />
```

**`href` decides the element.** With one it renders an `<a>`; without one, a `<button
type="button">`. Both carry the same row styling, the same `aria-current="page"` when active, and
both report through the enclosing nav's `nav` output. The anchor's native navigation is **not**
suppressed, so a middle-click or a ctrl-click behaves as a link should.

That is also why the binding is `none` rather than `button`: no single interactive pattern applies
to a component that renders two different elements. What the rendered element carries comes from
the platform and from `SideNav`'s own `navigation` binding.

`id` and `label` are both **required and guarded at runtime**. `icon` is a Phosphor class name that
Arena draws as an `aria-hidden` `<i>` — the single-icon convention, never a projected node.

`aria-current="page"` is present on the active row and **absent** on the rest, never `false`.

**Do / Don't**
- **Do** write one item per destination, as a sibling. Depth comes from the containers around it,
  and an item never declares its own.
- **Do** use `href` when the destination is a real URL, even in a routed app. A nav made of buttons
  cannot be opened in a new tab.
- **Don't** wrap it in anything expecting the indent to survive — it will, because depth is pulled
  through DI rather than pushed, but a wrapper still changes the flex layout of the column.
- **Don't** put a badge or a count inside it. The item takes no projected content; a row that needs
  one is a change to the contract, not to a caller.

- **`disabled` draws the destination and refuses it.** It reflects through `aria-disabled` rather
  than by not rendering the item: an unavailable destination a user can see, and hear announced as
  unavailable, is what tells them it exists. The anchor keeps its `href`, so the shape does not
  change; what changes is that the click is prevented and the nav is never told to activate.
