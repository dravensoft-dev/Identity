Arena failure state — something did not load, and there is a way to try again. Under
the API contract (`api/components/ErrorState.json`) Arena draws the primary retry
itself, from `retryLabel`/`retry` — the same drawn-from-data shape `Alert`'s
`actionLabel`/`action` uses — rather than leaving it to a consumer to project. The
`[secondaryAction]` slot stays projected, for whatever a consumer wants beside the
retry (a link to logs, say). The solid `--error` fill is what distinguishes it from
`arena-empty-state`'s dashed neutral border: one apologises and offers a retry, the
other simply has nothing yet. `code` renders the support code as a mono chip: it is
for a support conversation, not for the user to act on, which is why it is muted and
small. The actions wrapper only renders when a retry or a secondary action actually
exists — a bare error state ships no dead space for a retry it does not offer.

```html
<arena-error-state icon="ph-bold ph-plugs"
                   title="Couldn't reach the delivery API"
                   message="The dashboard is showing the last data it cached."
                   code="ERR_UPSTREAM_504"
                   [retryLabel]="'Retry'"
                   (retry)="retry()">
  <a secondaryAction href="/logs">View logs</a>
</arena-error-state>
```

Import `ArenaSecondaryAction` from `frameworks/angular/primitives/projection-markers`
(or the primitives barrel) alongside `ErrorState` in the host component's `imports` —
`secondaryAction` is a directive, not a plain attribute, because it is how the error
state detects that a secondary action was projected at all.

**Do / Don't**
- Always pass `retryLabel` when a retry could work. An error state with no retry is a
  dead end the user has to navigate out of.
- Say what still works, if anything does — "showing the last cached data" is more
  useful than "an error occurred".
- Don't put the raw exception in `message`. The code chip is where a machine-readable
  detail goes; the message is for a person.
- Don't use this for a validation failure on a field — that belongs on the field.
- Don't forget to import `ArenaSecondaryAction` when projecting a secondary action —
  without it, the `secondaryAction` attribute is inert and the content silently fails
  to render.
