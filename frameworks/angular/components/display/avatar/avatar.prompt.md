Arena avatar — a person's or team's mark. `src` renders the image; without it the
initials of `name` render on the raised surface, so `name` is always worth passing.
`shape="circle"` is a person, `shape="rounded"` a team or organisation. `status` adds
a presence dot. Styling is the sibling `avatar.variants.ts` recipe; the component
carries no CSS classes of its own.

```html
<arena-avatar name="Juan Carlos Hidalgo" />
<arena-avatar name="Delivery" shape="rounded" size="sm" />
<arena-avatar [src]="user.photo" [name]="user.name" size="lg" status="online" />
```

**Do / Don't**
- Always pass `name`, even with `src`: it is the image's `alt` text and the fallback
  when the image fails to load.
- Don't use the presence dot as a status badge for anything but presence — the
  offline tone is a muted grey by design and reads as "not here", not as "disabled".
- The presence dot is filled (`bg-success`/`bg-warning`/`bg-error`/`bg-base-content/52`)
  even though danger is outline everywhere else — presence is its own semantic
  family, not a danger surface. See README's Danger convention section.
- Don't put an avatar in place of an icon. It represents a person or an entity; a
  role or an action is an icon.
