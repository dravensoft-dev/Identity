Visual identity of a person or entity. With `src` it shows the image; without it, initials from `name`.

```tsx
<Avatar name="Lucy Fernandez" status="online" />
<Avatar src="/u/marco.jpg" name="Marco Ruiz" size="lg" />
<Avatar name="Aurora Bank" shape="rounded" />  {/* entity/team */}
```

<!-- @api GENERATED from contracts/api/components/Avatar.json. Edit the contract, not this table. -->

**Members**, in contract order and under this layer's own names. `*` marks a required one.

| Member | Form | Type | Default | What it is |
|---|---|---|---|---|
| `src` | primitive | `string` |  | Image URL. Absent renders initials from `name`. |
| `name` | primitive | `string` | `""` | The person or entity name. Its first two words' initials render when there is no `src`, and it is the image's alt text. |
| `size` | enum | `ArenaAvatarSize` | `"md"` | The avatar's diameter. |
| `shape` | enum | `ArenaAvatarShape` | `"circle"` | Circle for a person, rounded for a team. |
| `status` | enum | `ArenaAvatarStatus` |  | A presence dot in the state's colour. `offline` is a visible muted dot; omit `status` entirely for no dot. Optional: there is no invisible enum value. |

<!-- @api end -->

**Do / Don't**
- `circle` for people, `rounded` for teams/organizations.
- Always pass `name` (accessible name + fallback initials), even when there's a `src`.
- It's the only element, along with the switches, that can be fully round.
