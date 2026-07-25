Multi-line text input. Shares the same visual states as `Input`.

```jsx
<Textarea label="Deployment notes" rows={5} maxLength={280} counter
  value={notes} onChange={setNotes}
  hint="Attached to the delivery log." />
```

`onChange` carries the **new text as a string**, not the `ChangeEvent` — a platform
event type is an R4 violation inside a payload, so the event does not travel. Read the
value directly (`onChange={setNotes}`); there is no `e.target` and no `preventDefault()`.

The members are `label`, `hint`, `error`, `required`, `counter`, `autoResize`, `value`,
`disabled`, `readOnly`, `placeholder`, `name`, `maxLength` and `rows`, plus `onChange`.
That is the whole API: the `TextareaHTMLAttributes` heritage clause and the `{...rest}`
spread are gone, so global attributes — `className`, `dir`, `tabIndex`, ARIA and
`data-*` — no longer reach the `<textarea>`, and neither does a consumer `style` object.
**`id` is gone with them**: the component still generates one from `label` to wire the
label's `htmlFor`, but a consumer can no longer supply their own.

**Do / Don't**
- Real multi-line content (descriptions, notes, messages). For a single line use `Input`.
- With `maxLength`, enable `counter` so the limit is visible — the counter renders only
  when both are set.
- Pass `label` when the field needs a visible name; it is also what wires the generated
  `id` to the label, so a field without one has no label association to offer.
- Don't reach for a wrapper attribute or an inline `style` to size the field — compose it
  inside a container you control instead.
