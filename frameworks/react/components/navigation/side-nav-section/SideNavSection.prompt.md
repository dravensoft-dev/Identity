A named group of items inside a `SideNav` -- a subheading plus the items under it. It
**wraps** what you write; it never replaces it.

```tsx
<SideNav ariaLabel="Primary" active={route} onNav={(id) => setRoute(id)}>
  <SideNavItem id="dashboard" icon="ph-bold ph-squares-four" label="Projects" href="/projects" />
  <SideNavSection label="Workspace">
    <SideNavItem id="deploys" icon="ph-bold ph-rocket-launch" label="Deployments" href="/deploys" />
    <SideNavItem id="settings" icon="ph-bold ph-gear-six" label="Settings" />
  </SideNavSection>
</SideNav>
```

<!-- @api GENERATED from contracts/api/components/SideNavSection.json. Edit the contract, not this table. -->

**Members**, in contract order and under this layer's own names. `*` marks a required one.

| Member | Form | Type | Default | What it is |
|---|---|---|---|---|
| `label*` | primitive | `string` |  | Names the group, both on screen and to assistive technology. Required, and guarded at runtime: a blank label leaves the group with no accessible name, which is the defect the guard exists to prevent arriving through a value that is present, so the guard trims before it decides. |
| `children*` | slot |  |  | The items in the group -- SideNavItems, further SideNavSections, SideNavCollapsibles. Each sits one nesting level deeper than the section itself. Required, and guarded at runtime: a section with no children is not a legal shape, and the guard counts the way the render path counts, so a child that is a false conditional counts as absent rather than as one. The AppLogo.mark shape -- a slot that is both declared required and enforced -- and not the Tooltip.content one, which is declared required and deliberately left unguarded. |

<!-- @api end -->

The heading reads `label`, in the mono uppercase micro-label treatment, and is the group's
accessible name -- an `aria-labelledby` on the `role="group"` wrapper points at that same
heading element, so the grouping a sighted user sees is the grouping a screen reader
announces. Every item inside indents one step deeper than the section itself, and that
indent is `indentStep` (from the enclosing `SideNav`) applied again, not a second value of
its own -- see `SideNav.indentStep`.

## Do / Don't

- **Do** put a section only where a group of destinations shares one name. A single loose
  `SideNavItem` at the root needs no section at all.
- **Do** nest a `SideNavSection` inside another, or inside a `SideNavCollapsible`, when the
  navigation tree is more than two levels deep. Depth is injected, not counted by hand.
- **Don't** write a section with no children. It is not a legal shape and throws --
  allowing an empty one would give the component two shapes a single behaviour binding
  cannot describe.
- **Don't** leave `label` blank. It is required and guarded: a blank label leaves the group
  with no accessible name, which is the defect the guard exists to catch.
- **Don't** wrap its children in a fragment or a component of your own. `SideNavSection`
  injects into the children it is handed, and `React.Children.toArray` does not see
  through a `<>...</>` -- write items as siblings, or in an array, the same limit
  `SideNav` itself carries.
