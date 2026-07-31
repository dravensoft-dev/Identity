Arena status/emphasis tag — a pill whose `tone` follows the Badge/Tag taxonomy.
Standalone, `OnPush`, signal I/O. Styling is the sibling `Tag.variants.ts`
recipe; the component carries no CSS classes of its own. `removable` shows an
Arena-drawn dismiss `×` that emits `remove` on click.

```html
<arena-tag>Neutral</arena-tag>
<arena-tag tone="primary">Active</arena-tag>
<arena-tag tone="danger">Blocked</arena-tag>
<arena-tag removable (remove)="drop('staging')">Staging</arena-tag>
```

**Do / Don't**
- Use `tone="danger"` for a blocked/destructive status — the pill's border and
  text render in `--error`, never a fill. That is the danger convention; the
  only filled danger surface in Arena is `ConfirmDialog`'s final confirmation.
- The leading dot is filled (`bg-current`, coloured by `tone`) even for
  `tone="danger"`, though the pill itself is outline — a tone dot is an
  identity mark, the same family as `ActivityFeed`'s own dot and `Avatar`'s
  presence dot, not a danger surface. See README's Danger convention section.
- Use `removable` only when removing the tag is a real user action (applied
  filters), not on informational tags — and handle `(remove)`, or the × has
  nothing wired to it.
- Reach for `disabled` when removal is temporarily unavailable and the tag must
  stay on screen — a filter the user's permissions lock. The × keeps its place
  in the Tab sequence and announces itself as unavailable, which is why this is
  `aria-disabled` and not the native `disabled` attribute, and `remove` is never
  emitted while it is set. Without `removable` there is no × and it does nothing.
- Don't use `disabled` to mean "this tag is greyed out". A tag with no `×` is
  already inert; the state is about the remove action alone.
- Don't use a tag as a button. It is a status/emphasis label; an action belongs
  on an `arena-button`, not on the pill itself — the dismiss `×` is the one
  exception, and it is a real `<button>` gated on `removable`.
- Don't add a `tone` outside the taxonomy — the five tones are the whole set.
