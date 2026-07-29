The title block at the top of a page: an `h1`, an optional muted subtitle, and the page's actions pushed to the far side. Below `--bp-sm` it stacks and the actions stretch full width — measured on its own container, so it stacks inside a narrow panel too.

```jsx
<PageHead title="Deployments" />

<PageHead
  title="Client Portal"
  subtitle="Last published 2 h ago · build #4821"
  align="center"
  actions={<>
    <Button variant="secondary" size="sm">View logs</Button>
    <Button variant="primary" size="sm">Deploy</Button>
  </>}
/>
```

`align` (default `"start"`) governs only the wide layout's cross-axis alignment of the
actions block against the title — `"start"` keeps actions top-aligned with a tall title,
`"center"` vertically centers them against it. Below `--bp-sm` the row always stacks and
`align` has no effect. `PageHead` applies no outer bottom margin — the parent composes
that spacing, the way `Shell.jsx`'s header owns its own padding.

**Do**
- Use exactly one `PageHead` per page: it renders the `h1`, and a page has one.
- Keep the subtitle to a fragment of context ("Last published 2 h ago"), not a description of the page.
- Put the page's primary action here, and only the primary plus a couple of supports. A crowded head reads as a toolbar.
- Give the parent the bottom margin it needs — `PageHead` bakes none in.

**Don't**
- Don't use it as a section header inside a page — that is a heading, not a page head, and it would emit a second `h1`.
- Don't pass a destructive action as the visual lead. Danger stays outline (`variant="danger"`), never the filled primary.
