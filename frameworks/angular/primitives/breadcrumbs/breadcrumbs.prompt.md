Arena breadcrumb trail. Mono, wide-tracked, with the last crumb as the current page --
not a link, and carrying `aria-current="page"`. The host itself is the `nav` landmark
(`role="navigation"`, `aria-label="Breadcrumb"`); no wrapper element is rendered inside it.
Use it where a hierarchy is deeper than tabs can show.

A crumb renders as a real `<a href>`, so a plain click still navigates the browser. To
substitute SPA routing, call `event.preventDefault()` on the forwarded `MouseEvent` and
route yourself -- leave it alone and the native navigation (and ctrl-click, middle-click,
open-in-new-tab) keeps working for free:

```html
<arena-breadcrumbs [items]="[
  { label: 'Clients', href: '/clients' },
  { label: 'Ardennes', href: '/clients/ardennes' },
  { label: 'Deployments' }
]" (navigate)="go($event)" />
```

```ts
go({ crumb, event }: ArenaCrumbNavigateEvent): void {
  event.preventDefault();
  this.router.navigateByUrl(crumb.href ?? '/');
}
```

**Do / Don't**
- Keep the last crumb non-navigable. A link to the page you are on is noise, and it
  breaks the trail's promise that everything to the left is somewhere else.
- Don't use breadcrumbs for steps in a flow. A trail describes where something *is*,
  not how far through it you are -- that is the coachmark's dots or a stepper.
- Don't truncate the middle of a trail to save space. Wrap it; the row already does.
- Don't call `preventDefault()` inside a `(navigate)` handler unconditionally unless you
  are actually routing -- do it only on the branch that substitutes navigation, or a
  consumer loses ctrl-click/middle-click/open-in-new-tab for no reason.

**Accessibility note:** the trail renders no `<ol>`/`<li>` wrapper (matching React), so a
screen reader gets no "list, N items" orientation cue that the WAI-ARIA APG's breadcrumb
structure would otherwise give. `nav[aria-label="Breadcrumb"]` and `aria-current="page"`
are what make the trail operable and named; the list semantics were judged a secondary
nicety, not an operability gap, and left out on that basis rather than by oversight.
