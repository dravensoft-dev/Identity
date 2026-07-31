Arena breadcrumb trail. Mono, wide-tracked, with the last crumb as the current page --
not a link, and carrying `aria-current="page"`. The landmark is a real `<nav>` inside a bare
`display: contents` host, with `aria-label` bound to the required `ariaLabel` input, the same
carve-out `arena-pagination` takes, because the `navigation` pattern offers `role="navigation"`
only for when a `<nav>` cannot be used. Use it where a hierarchy is deeper than tabs can show.

**A consumer attribute written on `<arena-breadcrumbs>` lands on the inert host, not on the
styled `<nav>`**, which is the price every carve-out pays and is why the default is to
host-bind.

`ariaLabel` is **required**: `input.required`, so Angular throws when it is missing. A constant
like `"Breadcrumb"` written straight into the `host` block names the
WIDGET rather than the trail and leaves two of these on one page indistinguishable as
landmarks. Say which hierarchy this is a trail through ("Project navigation").

A crumb renders as a real `<a href>`, so a plain click still navigates the browser.
`navigate` reports the clicked `Crumb` alone -- the native `MouseEvent` is not forwarded,
so a listener cannot call `preventDefault()` to stop the anchor's own navigation.
Ctrl-click, middle-click and open-in-new-tab keep working for a consumer who wires
nothing; intercepting a plain click to substitute SPA routing now belongs at the router
(`routerLink`), not here:

```html
<arena-breadcrumbs ariaLabel="Project navigation" [items]="[
  { label: 'Clients', href: '/clients' },
  { label: 'Ardennes', href: '/clients/ardennes' },
  { label: 'Deployments' }
]" (navigate)="go($event)" />
```

```ts
go(crumb: Crumb): void {
  this.router.navigateByUrl(crumb.href ?? '/');
}
```

**Do / Don't**
- Keep the last crumb non-navigable. A link to the page you are on is noise, and it
  breaks the trail's promise that everything to the left is somewhere else.
- Don't use breadcrumbs for steps in a flow. A trail describes where something *is*,
  not how far through it you are -- that is the coachmark's dots or a stepper.
- Don't truncate the middle of a trail to save space. Wrap it; the row already does.
- Don't reach for `(navigate)` to call `preventDefault()` -- it never receives the click
  event, so it cannot stop the anchor's own navigation. Intercept at the router instead.

**Accessibility note:** the trail renders no `<ol>`/`<li>` wrapper, so a
screen reader gets no "list, N items" orientation cue that the WAI-ARIA APG's breadcrumb
structure would otherwise give. `nav[aria-label="Breadcrumb"]` and `aria-current="page"`
are what make the trail operable and named; the list semantics were judged a secondary
nicety, not an operability gap, and left out on that basis rather than by oversight.
