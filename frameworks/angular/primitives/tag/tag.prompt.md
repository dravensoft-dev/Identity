Arena status/emphasis tag — a pill whose `tone` follows the Badge/Tag taxonomy.
Standalone, `OnPush`, signal input. Styling is the sibling `tag.variants.ts`
recipe; the component carries no CSS classes of its own.

```html
<arena-tag>Neutral</arena-tag>
<arena-tag tone="primary">Active</arena-tag>
<arena-tag tone="danger">Blocked</arena-tag>
```

**Do / Don't**
- Use `tone="danger"` for a blocked/destructive status — it renders as an
  outline (border + text in `--error`), never a fill. That is the danger
  convention; the only filled danger surface in Arena is `ConfirmDialog`'s
  final confirmation.
- Don't use a tag as a button. It is a status/emphasis label; an action belongs
  on a `mat-button` (or `arena-` control), not on a pill.
- Don't add a `tone` outside the taxonomy — the five tones are the whole set.
