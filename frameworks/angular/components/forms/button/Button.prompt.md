Arena action button — one primary per view, and danger stays outline. Standalone, `OnPush`,
signal I/O. Styling is the sibling `Button.variants.ts` recipe; the component carries no CSS
classes of its own. The host stays bare and unstyled: the recipe lands on a real `<button>`
inside it, because the element carrying the behaviour contract must be the element the browser
already knows how to focus, activate and disable.

```html
<arena-button (click)="save()">Save changes</arena-button>
<arena-button variant="secondary" size="sm">Cancel</arena-button>
<arena-button variant="danger" icon="ph-bold ph-trash" (click)="confirmDelete()">Delete project</arena-button>
<arena-button variant="ghost" iconRight="ph-bold ph-caret-down">More</arena-button>
<arena-button loading>Deploying</arena-button>
<arena-button type="submit" form="project-form" full>Create project</arena-button>
```

**Do / Don't**
- Use `variant="danger"` for a destructive action — transparent background, border and text in
  `--error`. That is the danger convention, and the only filled danger surface in Arena is
  `ConfirmDialog`'s final confirmation.
- `loading` implies `disabled`: it swaps the leading icon for a spinner and blocks activation,
  so there is no need to set both. The spin **slows** under `prefers-reduced-motion` rather
  than stopping, because a frozen spinner reads as a hung process — that answer comes from the
  `arena-btn-spin` utility in the Tailwind layer, not from this component.
- `icon` and `iconRight` are Phosphor class-name strings Arena draws, never slots. That is the
  single-icon convention, and it is why this component projects a label and nothing else.
- Set `type` explicitly when the button sits in a form. It defaults to `button` on purpose: a
  bare `<button>` inside a form silently defaults to `submit`, which is the footgun this member
  exists to make explicit. Use `form` only when the button is **not** a descendant of the form
  it submits.
- Reach for `tabStop="false"` only inside a composite that manages its own focus — a grid with
  a roving tab stop, a menu — where reaching this control by Tab would be a second way in. It
  writes `tabindex="-1"` and the control stays programmatically focusable. A positive tab order
  is not expressible and never should be.
- Don't use `disabled` to mean "this action is not available yet" on a control the user must
  discover. A disabled button is unreachable by Tab and announces nothing about why; prefer
  keeping it enabled and reporting the reason on activation.
- Don't wrap `<arena-button>` in another button or an anchor. It renders a real `<button>`, and
  nesting interactive elements is invalid regardless of how it looks.
- Don't rely on click delegation from an ancestor. `click` is an output named after a native
  DOM event, and Angular then registers **both** the output subscription and a host DOM
  listener — so a consumer's `(click)` would fire twice on every press. The inner button calls
  `stopPropagation()` to make it fire once, which is the whole reason the event does not reach
  ancestors. Bind `(click)` on the `<arena-button>` itself. `type="submit"` still submits: the
  default action is untouched, only propagation is.

**By hand, in real Chromium** — neither of these is provable in happy-dom:
- With `loading` set, the spinner turns; with `prefers-reduced-motion: reduce` forced in
  DevTools' Rendering pane, it keeps turning and only slows.
- `active:scale-98` gives a real press response, and the focus ring is visible on keyboard
  focus for every one of the four variants — including `ghost`, whose border is transparent.
