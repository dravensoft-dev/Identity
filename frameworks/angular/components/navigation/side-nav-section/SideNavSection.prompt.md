Arena side-nav section, a labelled group of destinations inside an `arena-side-nav`. Standalone,
`OnPush`, signal I/O. Styling is the family's shared `SideNav.variants.ts` recipe. The host **is**
the group: `role="group"` and the `aria-labelledby` that names it sit on it, with the heading
rendered inside.

```html
<arena-side-nav-section label="Workspace">
  <arena-side-nav-item id="members" label="Members" href="/members" />
  <arena-side-nav-item id="billing" label="Billing" href="/billing" />
</arena-side-nav-section>
```

**Its content is required, and it is the only slot in the repository that is.** A section renders a
heading naming the group, so a childless one labels nothing, it **throws** at content-init rather
than rendering. Slot required-ness is not comparable between layers and no gate can catch a caller
who omits it, which is why the guard is runtime code and not a declaration.

It is a container, so it **re-provides** the family's state at `depth + 1`: everything inside it
indents one step, including a nested section or a collapsible. Its own heading is indented at its
**own** depth, so it lines up with its siblings rather than with its children.

The binding is `none`: the group carries no interactive affordance of its own, and every control
inside it belongs to a child.

**Do / Don't**
- **Do** give it a `label` that names the group rather than describing it, "Workspace", not
  "Workspace links".
- **Do** nest sections when the hierarchy genuinely has two levels. The indent compounds and
  nothing needs configuring.
- **Don't** use one to add a visual gap. An empty section throws, and a section of one item is a
  heading that outweighs what it introduces.
