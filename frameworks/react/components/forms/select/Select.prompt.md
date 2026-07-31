Styled native dropdown selector. `options` is an array of `{value, label}` objects.

```jsx
<Select label="Environment" value={env} onChange={setEnv}
  options={[{value:'prod',label:'Production'},
            {value:'stg',label:'Staging'},
            {value:'qa',label:'QA'}]} />
```

`options` takes **only** `SelectOption` objects. The bare-string form
(`options={['Production','Staging']}`) is gone: `(string | SelectOption)[]` is a union
between two forms, which R5 forbids, and the object form carries strictly more —
a stable `value` with a translatable `label` cannot be said in the string form at all.
Where value and label are the same, write it: `{value:'QA', label:'QA'}`.

`onChange` carries the **chosen option's value as a string**, not the `ChangeEvent` — a
platform event type is an R4 violation inside a payload, so the event does not travel.
Read the value directly (`onChange={setEnv}`); there is no `e.target` and no
`preventDefault()`.

The members are `label`, `options`, `value`, `disabled`, `required` and `name`, plus
`onChange`. There is no `multiple`: a multi-selection is a *set* of values and `onChange`
carries one `string`, so the attribute could reach the element while the event reported only
the first selected option. A native multi-select is a list box shown open, which is a different
control from the styled dropdown this component is. That is the whole API: the `SelectHTMLAttributes` heritage
clause and the `{...rest}` spread are gone, so global attributes — `id`, `className`,
`dir`, `tabIndex`, ARIA and `data-*` — no longer reach the `<select>`, and neither does
a consumer `style` object.

**Do / Don't**
- Use it for a short, known set of choices. Past roughly a dozen, reach for a searchable
  control instead of a dropdown the user has to scroll.
- Give `value` a stable identity and `label` the human wording, so the label can be
  translated without moving what the form submits.
- Pass `label` when the field needs a visible name; the control renders none otherwise.
- Don't reach for a wrapper attribute or an inline `style` to size the field — wrap it in
  a container you control instead.
