Arena checkbox — one independent choice, checked showing a crimson fill with a tick. Standalone,
`OnPush`, signal I/O. Styling is the sibling `Checkbox.variants.ts` recipe. The host stays bare
and out of layout: the root is a real `<label>` wrapping a real `<input type="checkbox">`, because
that pairing is what gives the control its role, its name and Space-to-toggle without a single
line of authored ARIA.

```html
<arena-checkbox label="Notify on failure" [checked]="notify()" (change)="notify.set($event)" />
<arena-checkbox label="Managed by policy" checked disabled />
<arena-checkbox label="I accept the terms" required name="terms" value="yes"
                [checked]="accepted()" (change)="accepted.set($event)" />
```

**Do / Don't**
- It is **controlled**. `checked` is what the consumer owns and pushes back in; the component
  never holds a copy, so a `(change)` you ignore is a checkbox that visibly does not move.
- **Always pass `label`.** It is optional in the contract, but the accessible name comes from the
  wrapping `<label>`'s own text, so a checkbox without one announces nothing. If the name must
  live elsewhere on screen, the control is the wrong shape — reach for a labelled group instead.
- `change` carries the new boolean, not the DOM event. It is an output named after a native DOM
  event, so Angular would register both the output subscription and a host DOM listener and a
  consumer's `(change)` would fire twice; the inner input calls `stopPropagation()` to make it
  fire once. The cost is that a native `change` never reaches an ancestor — bind on the
  `<arena-checkbox>` itself.
- `disabled` and `required` land on the native input, never as `aria-disabled` or
  `aria-required`. The native attributes are what the accessibility tree reads, what removes the
  control from the Tab order, and what the recipe's `:disabled`-family utilities can match.
- The box and the tick are decoration: the `<span>` carries the fill and the `<svg>` the tick,
  and neither is the control. Do not attach a click handler to either — the `<label>` already
  forwards a click to the input, and a second handler double-toggles.
- Don't use a checkbox for an immediate effect. A checkbox reads as a pending form value; a
  setting that applies the moment it flips is `<arena-switch>`.
- There is no indeterminate state. `aria-checked="mixed"` is in the pattern and not in this
  contract, so a partially-selected parent row needs a different control, not this one.

**By hand, in real Chromium** — none of these is provable in happy-dom. Run `bun run demos` and
open `/frameworks/angular/components/forms/checkbox/Checkbox.card.html`:
- The tick's stroke reads cleanly on the crimson fill at 100% zoom, and its box is `--sp-3`
  inside an `--sp-5` square rather than filling it.
- Clicking the label text toggles the box, and so does Space with the control focused.
- `disabled` dims the whole control to 50% and the cursor turns to not-allowed over the label
  as well as the box.
- **Known gap, shared with React and not fixed here**: the native input is `opacity-0 size-0`,
  so keyboard focus paints no visible ring on the box. Tab to the control and you will see
  nothing move. Recorded in `DOUBTS.md`; the fix is a `has-[:focus-visible]:` treatment on the
  box slot in the shared manifest, which would move React's parity and is not this batch's.
