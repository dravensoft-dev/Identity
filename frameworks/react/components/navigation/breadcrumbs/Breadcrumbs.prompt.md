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

A non-current crumb renders a real `<a href>`, and Arena splits its activations the way a
router link does. A primary click with no modifier, and Enter, are cancelled and reported
through `onNavigate(crumb)`, which carries the crumb alone and no DOM event: route from there
and the browser does not navigate underneath you. Ctrl-click, middle-click and open-in-new-tab
are the browser's, report nothing, and keep working for a consumer who wires no handler.

**Do / Don't**
- The last item is the current location: no link, styled in `--bone`.
- Don't replace tabs with breadcrumbs or vice versa; they coexist (tabs = sibling sections, breadcrumbs = depth).
- Don't reach for `onNavigate` to call `preventDefault()` -- it never receives the click
  event, and it does not need to: Arena has already cancelled the anchor by the time it fires.
- Don't wrap a crumb in your router's `Link`. `items` is data and the anchor is Arena's;
  navigate in `onNavigate` instead.
