Filter/technology/status chip. `tone` follows the Badge/Tag taxonomy and colours
the pill's border, text and leading dot together. `removable` shows a dismiss
`×`, which uses the standard Phosphor icon `ph-x` (H4) — the same close as
Toast.

```jsx
<Tag>TypeScript</Tag>
<Tag tone="success">Shipped</Tag>
<Tag tone="danger">Blocked</Tag>
<Tag removable onRemove={()=>drop('react')}>React</Tag>
```

**Do / Don't**
- Use `tone="danger"` for a blocked/destructive status — border and text render
  in `--color-error`, never a fill. That is the danger convention; the only
  filled danger surface in Arena is `ConfirmDialog`'s final confirmation.
- The leading dot is filled (`currentColor`, so it always matches the tone)
  even for `tone="danger"`, though the pill itself is outline — a tone dot is
  an identity mark, the same family as `ActivityFeed`'s own dot and `Avatar`'s
  presence dot, not a danger surface.
- Use `removable` only when removing the chip is a real user action (applied
  filters), not on informational tags — and pass `onRemove` alongside it, or
  the × renders with nothing to call.
- Don't mix the Tag/Toast × with the modal close: dialogs close with their
  explicit button (Cancel), not with the ph-x icon.
- Don't add a `tone` outside the taxonomy — `neutral`, `primary`, `success`,
  `warning`, `danger` are the whole set.
