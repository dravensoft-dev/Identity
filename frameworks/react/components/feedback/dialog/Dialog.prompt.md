Modal for confirmations and short forms. Overlay with blur.

```jsx
<Dialog open={o} onClose={close} eyebrow="Confirm" title="Deploy to production"
  footer={<><Button variant="ghost" onClick={close}>Cancel</Button><Button onClick={go}>Deploy</Button></>}>
  This action publishes build #4821 for all users.
</Dialog>
```

`title` is **required** and throws when missing. It is what names the dialog for
assistive technology — the panel's `aria-labelledby` points at it — and nothing
can derive a name for a dialog, because its subject is editorial. `open` is
required too and throws when absent; `open={false}` is the closed state and is
not an absence.

`width` is a **CSS string**, not a number — pass a token expression
(`width="calc(var(--sp-1) * 200)"`), never a bare `520`. The panel is capped at
`92vw` regardless, so a wide dialog still fits a narrow viewport.

Arena dismisses the dialog two ways, and both report through `onClose`: **Escape**
and a click on the backdrop. A third path is yours rather than Arena's — a button
in `footer` wired to the same handler — and it is worth naming only so the count
is not mistaken: `close` is one event with two sources inside the component, which
is what `contracts/api/components/Dialog.json` declares. Opening
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

## Verifying the focus trap by hand

A suite proves the boundary wrap, because that is Arena's own `.focus()` call and
happy-dom honours it. It cannot prove the **interior** — that Tab from a control in
the middle reaches the next one — because that is the browser's native sequential
focus navigation, which Arena does not implement and happy-dom does not have. A
browser-driven gate was refused as this repo's fourth non-portable gate, so the
interior is checked by a person against this list.

Serve the tree with `bun run demos`, open
`frameworks/react/components/feedback/Feedback.card.html`, and check all of:

1. **Tab to "Open dialog" and press Enter.** Focus must land on **Cancel**, the
   first focusable inside the panel — not stay on the trigger.
2. **Tab once.** Focus moves to **Deploy**. This is the step no suite can make:
   Cancel is the first focusable and not the last, so Arena's handler does nothing
   and the browser moves focus on its own. If this fails, the trap is fighting
   native navigation rather than bounding it.
3. **Tab again.** Focus wraps from Deploy back to Cancel. This one is Arena's.
4. **Shift+Tab.** Focus wraps from Cancel back to Deploy.
5. **Escape.** The dialog closes and focus returns to "Open dialog".

If you drive this through CDP rather than by hand, one gotcha costs an afternoon:
a `rawKeyDown` does not activate a button. Enter must be dispatched as `keyDown`
carrying `text: '\r'`. Tab and Escape are fine as `rawKeyDown`.
