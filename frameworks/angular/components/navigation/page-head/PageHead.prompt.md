Arena page header: the display-weight title, an optional subtitle, and the page's
actions. It measures **itself**, not the viewport, and stacks below `--bp-sm` — a page
head inside a narrow panel stacks there too, on any screen. Actions are projected, so
they are real `mat-button`s wearing Arena.

```html
<arena-page-head title="Deployments" subtitle="Everything shipped in the last 30 days" align="center">
  <div actions>
    <button mat-stroked-button>Export</button>
    <button mat-flat-button>New deployment</button>
  </div>
</arena-page-head>
```

`title` is required — a page head with no title is a bug, not a state. `align` (default
`start`) governs only the wide layout's cross-axis alignment of the actions block against
the title; below `--bp-sm` the row always stacks and `align` has no effect. `arena-page-head`
applies no outer bottom margin — the parent composes that spacing.

Import `ArenaActions` from `frameworks/angular/primitives/projection-markers` (or the
primitives barrel) alongside `PageHead` in the host component's `imports` —
`actions` is a directive, not a plain attribute, because it is how the page head
detects that actions were projected at all. Without it the attribute is inert, the
actions wrapper never renders, and the buttons silently disappear. `ArenaActions` is
shared: every primitive with a plural, toolbar-shaped projected slot imports the same
directive rather than declaring its own.

The measurement helper is public too. `containerWidth()` and `readBreakpoint()` are
exported from `frameworks/angular/primitives/container-size` for a consumer building
their own responsive component: call both from an injection context (a field
initializer or the constructor), render the wide layout while the width is still
`null`, and compare against the breakpoint token rather than writing a media query.

**Do / Don't**
- Exactly one `arena-page-head` per screen. It emits the `h1`, and a page with two
  `h1`s has no outline.
- Keep the subtitle to one line of orientation. It is not the place for instructions.
- Don't write a media query to stack it. It already stacks, on its own width, which is
  the measurement that is right more often.
- Don't wrap each button in its own `actions` element. One wrapper holds them
  all; the recipe already lays them out in a wrapping row.
