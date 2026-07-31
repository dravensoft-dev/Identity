Arena toast — an ephemeral notice with a tone-coloured side bar and one optional action.
Standalone, `OnPush`, signal I/O. Styling is the sibling `Toast.variants.ts` recipe; the
component carries no CSS classes of its own. The host **is** the card, so `<arena-toast>` is the
element you place.

It positions nothing and owns no clock. The host decides where the stack sits and when each
notice goes — `dismissDefault` and `dismissActionable` in `frameworks/angular/Tokens.generated`
are the two intervals to run it off. The component's only say in the matter is `data-persist`,
which it sets when the notice must not be taken away on a timer.

```html
@for (notice of notices(); track notice.id) {
  <arena-toast [title]="notice.title" [message]="notice.message" [tone]="notice.tone"
               actionLabel="Retry" dismissible
               (action)="retry(notice)" (close)="drop(notice)" />
}
```

**Tone decides how the message is announced, and that is the whole reason this primitive
exists.** `tone="danger"` renders `role="alert"` with `aria-live="assertive"`, so a critical
message interrupts whatever a screen reader is already saying; every other tone renders
`role="status"` with `aria-live="polite"` and queues behind it. `persist` is **implied by
danger and ignores an explicit `false`** — a critical message that vanishes on a timer is one a
user can miss entirely — and a pinned toast says so visibly with the `Pinned` marker as well as
in `data-persist`.

`dismissible` gates the ×. It exists because Angular cannot ask whether an output has
subscribers, so the host has to say whether the notice is closeable rather than have Arena infer
it from a `close` listener.

**Do / Don't**
- **Do** read `data-persist` in the host's own clock and skip the timer for any toast that
  carries it. Danger sets it for you; anything else sets it through `persist`.
- **Do** keep `message` to one line of consequence. The title is the lead; a toast is not where
  a paragraph goes.
- **Don't** put more than one action on it. `actionLabel` is singular on purpose — Undo, Retry,
  View logs. A notice with two choices is a dialog.
- **Don't** reach for `tone="danger"` for anything a user can ignore. Assertive announcement cuts
  a screen reader off mid-sentence, and a tone that always interrupts stops meaning anything.
- **Don't** give it a `position` of its own. It carries `--z-toast`, the one slot above every
  other overlay including the CDK layer, but a statically-positioned element ignores `z-index` —
  the stack's own container is what places it.

**By hand, in real Chromium** — the announcement is a screen reader's, not a browser's, so what
this page shows is the rest. Run `bun run demos` and open
`/frameworks/angular/components/feedback/toast/Toast.card.html`:
- Each tone's left bar takes its own colour and the card surface never does — danger is
  **outline**, never a filled red panel.
- A danger toast shows `Pinned` even when the host passed `persist="false"`, and the demo's
  clock leaves it alone while every other toast expires.
- The action and the × are two separate controls, both reachable by Tab, and the × sits outside
  the body column rather than inside it.
- Stacked against an open dialog, a toast paints above it.
