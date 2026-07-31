Arena side-nav collapsible — a disclosure inside an `arena-side-nav`: a trigger row that shows and
hides a group of destinations. Standalone, `OnPush`, signal I/O. Styling is the family's shared
`SideNav.variants.ts` recipe.

```html
<arena-side-nav-collapsible id="deploys" icon="ph-bold ph-rocket-launch" label="Deployments"
                            (toggle)="remember('deploys', $event)">
  <arena-side-nav-item id="prod" label="Production" href="/prod" />
  <arena-side-nav-item id="staging" label="Staging" href="/staging" />
</arena-side-nav-collapsible>
```

The trigger is a native `<button type="button">` carrying `aria-expanded` and an `aria-controls`
naming its region. **The region is always rendered** and hidden by the `hidden` attribute alone —
the preflight's `[hidden] { display: none !important }` outranks the region's own `flex`, where
React has to set both because its inline display would win. So `aria-controls` never points at
nothing, and a collapsed region's links are out of the tab order because `hidden` removes them.

**It opens itself around the active destination, and that is not a press.** If any row anywhere in
its subtree is `active`, the group expands — including a group two levels up from the row. That
expansion is Arena's decision, so it reports **nothing** through `toggle`; reporting it would be a
lie a consumer persists. A user may then collapse a group holding the active destination and it
stays collapsed: the state is derived at the seed and owned by the user afterwards.

Enter and Space are **intercepted and prevented**, then toggle. That is one rule shared with
`arena-menu`: leaving them to the platform means the synthesized click fires too, and the group
opens twice in a browser while a suite sees it open once.

`defaultExpanded` seeds the first render only. `toggle` carries the state it moved to.

**Do / Don't**
- **Do** persist `toggle` if the rail should remember itself across a reload. Arena keeps no
  storage of its own.
- **Do** nest one inside another when the hierarchy has three levels. They are independent
  disclosures and neither closes the other.
- **Don't** read this as a treeview. There is no `aria-level`, no roving tab stop and no arrow
  navigation, and that is refused rather than missing — a nav landmark full of links is a set of
  disclosures, and the binding states the cost.
- **Don't** put a destination on the trigger itself. It opens a group; a row that navigates is an
  `arena-side-nav-item`.
