The fixed box a stack of notices lives in. `Toast` carries `--z-toast` and no `position` of its
own, and CSS only honors `z-index` on a positioned box or a flex item, so a `<Toast>` dropped into
static flow quietly stops floating. This is what makes it a flex item.

```tsx
<ToastHost>
  {toasts.map((t) => (
    <Toast key={t.id} tone={t.tone} title={t.title} message={t.message}
           actionLabel={t.actionLabel} onAction={t.onAction}
           persist={t.persist} dismissible onClose={() => drop(t.id)} />
  ))}
</ToastHost>
```

`placement` picks the corner: `top-start`, `top-end`, `bottom-start`, `bottom-end`, default
`bottom-end`. The inline half is `start`/`end` rather than left/right, so a right-to-left document
flips the stack with the text. A bottom placement stands off `max(var(--sp-6),
var(--pad-safe-bottom))`, so on a phone the stack clears the home indicator instead of sitting
under it.

**It owns no clock, and it counts nothing.** The queue that produced these notices already holds
their ids, their order and how many there are, so the timer and any ceiling stay there. Take the
interval from `TOAST_DISMISS`, exported beside `Toast`, rather than typing a number:
`if (!t.persist) setTimeout(dismiss, t.actionLabel ? TOAST_DISMISS.actionable : TOAST_DISMISS.default);`.

**Do / Don't**
- **Do** mount exactly one per placement, at the root of the app, outside anything that scrolls or
  transforms: a `transform` on an ancestor makes it the containing block for a fixed child, and the
  stack then scrolls away with that ancestor instead of staying put.
- **Do** leave the notices in the order they were raised. The stack is a plain column, so what is
  read is what is seen, and reversing the array to put the newest on top puts it last in the
  reading order.
- **Don't** wrap a `<Toast>` in a `<div>` inside it. The gap is a flex gap between the notices
  themselves, and a wrapper takes the flex-item role away from the notice.
- **Don't** put anything but notices in it. It is one positioned box with a z-index above every
  overlay in the system; anything else parked there covers the whole app.
