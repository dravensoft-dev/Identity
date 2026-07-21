Arena event feed. Each item is an actor, an action, an optional target and an optional
time; `tone` colours the leading dot from Badge's vocabulary. Styling is the sibling
`activity-feed.variants.ts` recipe.

```html
<arena-activity-feed [items]="[
  { id: 1, actor: 'Marta', action: 'deployed', target: 'billing@2.4.1', time: '2m', tone: 'success' },
  { id: 2, actor: 'Ivan', action: 'opened an incident on', target: 'auth', time: '18m', tone: 'danger' },
  { id: 3, actor: 'Rae', action: 'approved the rollback', time: '1h' }
]" />
```

**Do / Don't**
- Keep the grammar. The actor is bold, the action is prose, the target is mono — a feed
  whose rows each read differently is a list, not a feed.
- Use `tone` for what the event *means*, not for variety. Seven tones cycling by row is
  decoration, and it makes the one row that matters invisible.
- Don't put controls in a row. A feed reports; an action on an event belongs on the thing
  itself.
- The dot is filled (`bg-current`, coloured by `tone`) even for `tone="danger"`, though
  danger is outline everywhere else — a tone dot is an identity mark, the same family as
  `Tag`'s own dot and `Avatar`'s presence dot, not a danger surface. See README's Danger
  convention section.
