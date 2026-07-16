Multi-line text input. Shares the same visual states as `Input`.

```jsx
<Textarea label="Deployment notes" rows={5} maxLength={280} counter
  value={notes} onChange={e=>setNotes(e.target.value)}
  hint="Attached to the delivery log." />
```

**Do / Don't**
- Real multi-line content (descriptions, notes, messages). For a single line use `Input`.
- With `maxLength`, enable `counter` so the limit is visible.
