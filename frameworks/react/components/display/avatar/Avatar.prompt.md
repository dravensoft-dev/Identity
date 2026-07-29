Visual identity of a person or entity. With `src` it shows the image; without it, initials from `name`.

```jsx
<Avatar name="Lucy Fernandez" status="online" />
<Avatar src="/u/marco.jpg" name="Marco Ruiz" size="lg" />
<Avatar name="Aurora Bank" shape="rounded" />  {/* entity/team */}
```

**Do / Don't**
- `circle` for people, `rounded` for teams/organizations.
- Always pass `name` (accessible name + fallback initials), even when there's a `src`.
- It's the only element, along with the switches, that can be fully round.
