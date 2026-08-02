The bar of destinations pinned to the bottom of a phone screen. Compound, the `SideNav`/`SideNavItem`
shape: write one `<BottomNavItem>` per destination and the bar settles which is active and how each
one reports.

```tsx
<BottomNav ariaLabel="Primary" active={route} onNav={setRoute}>
  <BottomNavItem id="home" icon="ph-bold ph-house" label="Home" href="/" />
  <BottomNavItem id="orders" icon="ph-bold ph-receipt" label="Orders" href="/orders" badge={12} />
  <BottomNavItem id="clients" icon="ph-bold ph-users" label="Clients" href="/clients" />
  <BottomNavItem id="more" icon="ph-bold ph-dots-three" label="More" />
</BottomNav>
```

**It is not a `SideNav` lying down.** A sidebar is a stack of indented rows with the glyph before the
label and arbitrary nesting; this is a row of equal columns with the glyph above the label and no
nesting at all. It is not `Tabs` either, which mounts every panel at once and announces
tablist/tab/tabpanel, and not a `SegmentedControl`, which is a radio group that chooses rather than
navigates.

Its geometry is Arena's tokens rather than a number: `--layout-bar` for the height, `--z-nav` for the
stacking slot, and `--pad-safe-bottom` so the row clears the home indicator on a device that has one.
Reserve the same height at the foot of the page it covers, or the last row of content sits under it.

**`ariaLabel` is required and guarded**, trimmed before it decides. A phone shell usually carries
this bar and a header or a sidebar too, so two navigation landmarks share a page and each needs its
own name.

**Do / Don't**
- **Do** give a destination an `href` when it is one. The item renders a real `<a>`, so it opens in a
  new tab, its address copies, and it is announced as a link.
- **Do** route in `onNav`. Arena has already cancelled the primary click by the time it fires, so
  routing there navigates once; ctrl-click and middle-click stay the browser's and report nothing.
- **Don't** put `routerLink` on it. The anchor is inside the component, so a router directive placed
  outside cannot see it, ignores the modifiers and adds a second tab stop.
- **Don't** exceed five destinations. Every column takes an equal share, and a sixth makes the labels
  truncate before anyone has read them.
- **Don't** reach for it above a phone width. It covers the bottom of the viewport, and a wide screen
  has a sidebar's room.
