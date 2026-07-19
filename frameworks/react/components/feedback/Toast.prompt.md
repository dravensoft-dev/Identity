Ephemeral notification. Use `action` to give the user an out: **Undo** after an action (H3) or **Retry / View logs** after an error (H9). Error/critical toasts carry **`persist`** so the host does NOT auto-dismiss them (H1); they only close via the × or an action.

```jsx
<Toast tone="neutral" title="Deployment archived" action={{ label: 'Undo', onClick: undo }} onClose={dismiss} />
<Toast tone="danger" persist title="Pipeline failed" message="e2e tests in checkout" action={{ label: 'View logs', onClick: openLogs }} onClose={dismiss} />
```

On the host, respect `persist`: `if (!toast.persist) setTimeout(dismiss, 4200);`

**Do / Don't**
- `persist` on every error/critical toast; the close uses the standard `ph-x` icon (H4).
- Don't cram long messages into all caps, and don't use the Toast for destructive confirmations (that's `ConfirmDialog`).
- Don't render `<Toast>` straight into a statically-positioned parent. Toast carries `zIndex: var(--z-toast)` but no `position` of its own — CSS only honors `z-index` on a positioned box or a flex/grid item, so on plain static flow the token does nothing and the one thing that must float above everything quietly stops floating. Host it yourself in a fixed, `display:flex` container, the way `.toast-wrap` does in `frameworks/react/ui_kits/console/index.html` (`position:fixed; ...; display:flex; flex-direction:column`) — that's what makes each `<Toast>` a flex item and lets `--z-toast` take effect.