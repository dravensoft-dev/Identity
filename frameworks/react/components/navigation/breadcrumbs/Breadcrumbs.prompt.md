Breadcrumb navigation (H3). Gives an explicit return path when the hierarchy is deeper than the tabs. The last item is the current page (not linked).

```tsx
<Breadcrumbs ariaLabel="Project navigation" items={[
  { label: 'Projects', href: '/projects' },
  { label: 'Checkout', href: '/projects/checkout' },
  { label: 'Deployment #482' },
]} onNavigate={(crumb) => go(crumb)} />
```

`ariaLabel` names the landmark and is **required**, throwing when absent. A constant like
`"Breadcrumb"` names the WIDGET rather than the trail, which leaves two of these on one page
as indistinguishable landmarks while the requirement reads as met. Say which hierarchy this is
a trail through ("Project navigation").

A non-current crumb's click reports `onNavigate(crumb)` -- the crumb alone, with no DOM
event. The anchor still navigates natively, so ctrl-click, middle-click and
open-in-new-tab keep working for a consumer who wires nothing, but intercepting a plain
click to substitute SPA routing is not possible from `onNavigate`; do that at the
router (`Link`) instead.

**Do / Don't**
- The last item is the current location: no link, styled in `--bone`.
- Don't replace tabs with breadcrumbs or vice versa; they coexist (tabs = sibling sections, breadcrumbs = depth).
- Don't reach for `onNavigate` to call `preventDefault()` -- it never receives the click
  event, so it cannot stop the anchor's own navigation. Intercept at the router instead.
