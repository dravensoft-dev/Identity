Arena multi-line text field — label above, hint or error and an optional counter below.
Standalone, `OnPush`, signal I/O. Styling is the sibling `Textarea.variants.ts` recipe; the host
binds the root slot, so `<arena-textarea>` is itself the column its parent lays out. The control is
a real `<textarea>`, named by a real `<label for>`.

```html
<arena-textarea label="Release notes" [value]="notes()" (change)="notes.set($event)"
                hint="Markdown is supported" [rows]="6" />

<arena-textarea label="Summary" counter [maxLength]="280"
                [value]="summary()" (change)="summary.set($event)" />

<arena-textarea label="Commit message" autoResize
                [value]="message()" (change)="message.set($event)" />

<arena-textarea label="Reason" required [error]="reasonError()"
                [value]="reason()" (change)="reason.set($event)" />
<arena-textarea label="Generated changelog" readOnly [value]="changelog()" />
```

**Do / Don't**
- It is **controlled**, and Angular will not force the DOM back: ignore `change` and the box keeps
  what the user typed, where React re-renders it away. Wire the signal.
- There is **no validator here**, unlike `arena-input`. `error` is the only route to the error
  state, and it is the consumer's to compute — which is why the recipe has two state arms rather
  than three and there is no valid (green check) state at all.
- The counter needs **both** `counter` and `maxLength`. A `maxLength` alone caps the field; it
  does not ask for the count to be shown. Past nine tenths of the cap the counter switches to the
  warning slot — a different slot, not a variant, which is why the manifest names two.
- `autoResize` forces `resize: none` and grows the box from its own `scrollHeight`.
  **This layer resizes on more occasions than React's does, deliberately.** React grows only in
  its change handler, so a value set programmatically leaves the box its old height; Angular runs
  the same measurement in an `afterRenderEffect` that reads `value()`, so mount and every
  programmatic change size it too. That is a fix rather than a divergence to preserve, and it is
  recorded in `DOUBTS.md` as such.
- `rows` is the *initial* height and still applies under `autoResize` — it is what the box is
  before it has content to measure.
- `required` and `readOnly` land on the native attributes rather than on `aria-required` and
  `aria-readonly`; a native control already reports both, and writing them twice is two claims
  that can disagree. `aria-multiline` is likewise absent on purpose: a `<textarea>` is multiline
  by being one.
- `change` is an output named after a native DOM event, so the control calls `stopPropagation()`
  on the native `change` and a commit does not read as a second edit. Bind on the
  `<arena-textarea>` itself; the native event never reaches an ancestor.
- The error line **replaces** the hint. The foot keeps an empty placeholder when there is neither,
  so the counter stays hard right instead of sliding under the label.
- `id` is derived from `label` as `ta-<slug>`, matching React exactly — note the prefix differs
  from `arena-input`'s `in-`, so the two never collide on a form that labels both the same.

**By hand, in real Chromium** — none of these is provable in happy-dom, and the first one cannot
be: happy-dom has no layout, so `scrollHeight` is `0` and a growing box and a broken one look
identical to any suite. Run `bun run demos` and open
`/frameworks/angular/components/forms/textarea/Textarea.card.html`:
- **`autoResize`**: the box grows line by line as you type and shrinks again when you delete, with
  no scrollbar ever appearing. The one seeded with a long value is already tall on load — that is
  the `afterRenderEffect`, and it is the part React does not do.
- Without `autoResize` the grip in the corner resizes vertically and not horizontally.
- The gold focus ring lands on the textarea itself, where `arena-input`'s lands on a wrapping
  group.
- The counter turns amber between 90% and 100% of the cap, and the field stops accepting input at
  the cap because `maxlength` is native.
