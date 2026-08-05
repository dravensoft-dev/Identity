Filter/technology/status chip. `tone` follows the Badge/Tag taxonomy and colours
the pill's border, text and leading dot together. `removable` shows a dismiss
`×`, which uses the standard Phosphor icon `ph-x` (H4), the same close as
Toast.

```tsx
<Tag>TypeScript</Tag>
<Tag tone="success">Shipped</Tag>
<Tag tone="danger">Blocked</Tag>
<Tag removable onRemove={()=>drop('react')}>React</Tag>
```

<!-- @api GENERATED from contracts/api/components/Tag.json. Edit the contract, not this table. -->

**Members**, in contract order and under this layer's own names. `*` marks a required one.

| Member | Form | Type | Default | What it is |
|---|---|---|---|---|
| `children` | slot |  |  | The tag's label. |
| `tone` | enum | `ArenaTagTone` | `"neutral"` | The tag's emphasis colour. |
| `removable` | primitive | `boolean` | `false` | Whether the dismiss × is shown. Every layer gates the × on this member and never on whether anything listens for `remove`, because Arena never derives what it draws from what a consumer listens for. Removability is a declared input, not something inferred from the event. |
| `disabled` | primitive | `boolean` | `false` | Whether removal is unavailable while the tag stays visible: a filter a consumer's permissions lock, not a tag that is merely inert. It reflects through `aria-disabled` rather than the native `disabled` attribute, so the × keeps its place in the tab order and a screen-reader user is told the action is unavailable instead of never finding it. With `removable` false there is no × and nothing to disable. |
| `onRemove` | event |  |  | The dismiss × was activated. Never emitted while `disabled`. |

<!-- @api end -->

**Do / Don't**
- Use `tone="danger"` for a blocked/destructive status: border and text render
  in `--color-error`, never a fill. That is the danger convention; the only
  filled danger surface in Arena is `ConfirmDialog`'s final confirmation.
- The leading dot is filled (`currentColor`, so it always matches the tone)
  even for `tone="danger"`, though the pill itself is outline, a tone dot is
  an identity mark, the same family as `ActivityFeed`'s own dot and `Avatar`'s
  presence dot, not a danger surface.
- Use `removable` only when removing the chip is a real user action (applied
  filters), not on informational tags, and pass `onRemove` alongside it, or
  the × renders with nothing to call.
- Reach for `disabled` when removal is temporarily unavailable and the chip must
  stay on screen, a filter the user's permissions lock. The × keeps its place
  in the Tab sequence and announces itself as unavailable, which is why this is
  `aria-disabled` and not the native `disabled` attribute. Without `removable`
  there is no × and `disabled` does nothing.
- Don't use `disabled` to mean "this chip is greyed out". A tag with no `×` is
  already inert; the state is about the remove action alone.
- Don't mix the Tag/Toast × with the modal close: dialogs close with their
  explicit button (Cancel), not with the ph-x icon.
- Don't add a `tone` outside the taxonomy: `neutral`, `primary`, `success`,
  `warning`, `danger` are the whole set.
