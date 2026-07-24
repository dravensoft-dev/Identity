An event feed. The component knows the grammar — someone did something to something,
then — and gives each part its own ink: `actor` in `--bone`, `action` in `--bone-dim`,
`target` in mono `--gold`, `time` in mono `--mute` pushed right. A tone dot leads
each row.

```jsx
<ActivityFeed items={[
  { id: '1', actor: 'ana@',   action: 'approved the release', target: 'build #4821', time: '2h ago' },
  { id: '2', actor: 'diego@', action: 'opened incident',      target: 'checkout latency', time: '3h ago', tone: 'danger' },
]} />
```

`tone` is Badge's vocabulary — `neutral · accent · gold · success · warning · danger ·
info` — and defaults to `accent`.

**There is no row escape hatch.** `renderItem` was removed from the API contract:
Angular has no binding for per-item projection (it would need a structural directive
and `ngTemplateOutlet`, which no row of the binding table covers), so React cannot keep
a capability the other layer cannot implement. A consumer can no longer place their own
markup inside one row — the event must fit `actor` / `action` / `target` / `time` / `tone`,
or it does not belong in this component.

## Do / Don't

- **Do** put it inside a `Card` when it is a panel's content. It renders no surface of
  its own — the first row has no top rule for exactly that reason.
- **Do** give each item a stable `id`. Index keys reorder badly on a feed that prepends.
- **Don't** use `tone` decoratively. It is the event's status, and status colours mean
  what they mean everywhere else in the system.
- **Don't** put an action button in the row. A feed reports; it does not operate. If a
  row needs an affordance, that is a `Table`.
