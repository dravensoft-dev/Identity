Modal for confirmations and short forms. Overlay with blur.

```jsx
<Dialog open={o} onClose={close} eyebrow="Confirm" title="Deploy to production"
  footer={<><Button variant="ghost" onClick={close}>Cancel</Button><Button onClick={go}>Deploy</Button></>}>
  This action publishes build #4821 for all users.
</Dialog>
```

`title` is **required** and throws when missing. It is what names the dialog for
assistive technology — the panel's `aria-labelledby` points at it — and nothing
can derive a name for a dialog, because its subject is editorial.

The dialog dismisses three ways, and all three go through `onClose`: **Escape**,
a click on the backdrop, and whatever the consumer puts in `footer`. Opening
moves focus to the first focusable element inside the panel; closing returns it
to whatever had focus before, so a keyboard user lands back on the control that
opened the dialog. Tab and Shift+Tab wrap at the panel's edges rather than
walking out into the page behind the scrim.

- **Do** give every dialog a `title` that says what it is about, not what it is
  ("Delete project", never "Dialog").
- **Do** keep the dismissing control in `footer` — Escape is a shortcut for it,
  never the only way out.
- **Don't** render a second modal inside a `Dialog`. The trap is per panel, and
  two of them nested fight over the same Tab key.
- **Don't** put a `tabIndex={-1}` on content the user has to reach: it is how the
  trap decides what is focusable, so a control held out of the Tab order is a
  control the wrap skips over.
