Arena failure state — something did not load, and there is a way to try again. The
retry is projected, so it is a real `mat-button` wearing Arena, not a second button
implementation. The solid `--error` fill is what distinguishes it from
`arena-empty-state`'s dashed neutral border: one apologises and offers a retry, the
other simply has nothing yet. `code` renders the support code as a mono chip: it is
for a support conversation, not for the user to act on, which is why it is muted and
small. The actions wrapper only renders when something is actually projected — a
bare error state ships no dead space for a retry it does not offer.

```html
<arena-error-state icon="ph-bold ph-plugs"
                   title="Couldn't reach the delivery API"
                   message="The dashboard is showing the last data it cached."
                   code="ERR_UPSTREAM_504">
  <button arena-action mat-flat-button (click)="retry()">Retry</button>
</arena-error-state>
```

Import `ArenaErrorAction` alongside `ErrorState` in the host component's `imports` —
`arena-action` is a directive, not a plain attribute, because it is how the error
state detects that an action was projected at all. (It is a distinct symbol from
`arena-empty-state`'s `ArenaAction`, even though both mark the same `[arena-action]`
attribute — the two primitives' barrels are re-exported together, so identically
named classes would collide.)

**Do / Don't**
- Always offer a retry when a retry could work. An error state with no action is a
  dead end the user has to navigate out of.
- Say what still works, if anything does — "showing the last cached data" is more
  useful than "an error occurred".
- Don't put the raw exception in `message`. The code chip is where a machine-readable
  detail goes; the message is for a person.
- Don't use this for a validation failure on a field — that belongs on the field.
- Don't forget to import `ArenaErrorAction` when projecting an action — without it,
  the `arena-action` attribute is inert and the action silently fails to render.
