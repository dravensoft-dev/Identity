Ephemeral notification. Use `actionLabel` + `onAction` to give the user an out: **Undo** after an action (H3) or **Retry / View logs** after an error (H9). Error/critical toasts carry **`persist`** so the host does NOT auto-dismiss them (H1); they only close via the × or an action.

```tsx
<Toast tone="neutral" title="Deployment archived" actionLabel="Undo" onAction={undo} dismissible onClose={dismiss} />
<Toast tone="danger" persist title="Pipeline failed" message="e2e tests in checkout" actionLabel="View logs" onAction={openLogs} dismissible onClose={dismiss} />
```

<!-- @api GENERATED from contracts/api/components/Toast.json. Edit the contract, not this table. -->

**Members**, in contract order and under this layer's own names. `*` marks a required one.

| Member | Form | Type | Default | What it is |
|---|---|---|---|---|
| `title` | primitive | `string` |  | The bold lead line. |
| `message` | primitive | `string` |  | The body. |
| `tone` | enum | `ArenaToastTone` | `"neutral"` | The side bar's colour, and whether the toast announces assertively. |
| `actionLabel` | primitive | `string` |  | The label of the single inline action: Undo, Retry, View logs. Absent renders no action. |
| `onAction` | event |  |  | The inline action was activated. |
| `persist` | primitive | `boolean` | `false` | Disables the host's auto-dismiss and shows the Pinned marker. **Implied by `tone: "danger"`, which ignores `false`**: a critical message that vanishes on a timer is one a user can miss entirely, and this was documented as mandatory in an error state while nothing enforced it. Set it explicitly for any other tone that must not disappear on its own. |
| `dismissible` | primitive | `boolean` | `false` | Whether the × is shown. Every layer gates the × on this member and never on whether anything listens for `close`, because Arena never derives what it draws from what a consumer listens for. |
| `onClose` | event |  |  | The × was activated. |

<!-- @api end -->

The action is a label and an event, never one object: an object member is pure data with known
fields, and a callback is not data; `Alert` takes the same pair for the same reason.

**`dismissible` is what shows the ×**, not the presence of `onClose`. A handler alone renders no
close button, because a layer that cannot detect a listener could not implement the other rule.

On the host, respect `persist`, and take the interval from `TOAST_DISMISS`, exported beside the
component, rather than typing a number:
`if (!t.persist) setTimeout(dismiss, t.actionLabel ? TOAST_DISMISS.actionable : TOAST_DISMISS.default);`.
The longer clock keys off `actionLabel`, which is what actually renders the button, because a
notice carrying one asks the reader to decide rather than only to read. They are tokens, so a host
that reads them stays in step with a release that moves one; a host that retypes 4200 does not.

**Do / Don't**
- `persist` on every error/critical toast; the close uses the standard `ph-x` icon (H4).
- Don't cram long messages into all caps, and don't use the Toast for destructive confirmations (that's `ConfirmDialog`).
- Don't render `<Toast>` straight into a statically-positioned parent. Toast carries `zIndex: var(--z-toast)` but no `position` of its own; CSS only honors `z-index` on a positioned box or a flex/grid item, so on plain static flow the token does nothing and the one thing that must float above everything quietly stops floating. Put it in a `<ToastHost>`, which is the fixed, `display:flex` container that makes each `<Toast>` a flex item and lets `--z-toast` take effect.