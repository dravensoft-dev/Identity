A single checkbox. Checked shows a crimson fill with a check. `onChange` carries the **new checked state** as a boolean — not the DOM event — so a `useState` setter can be passed straight to it. `name` and `value` are what a native form submits when the box is ticked, and `required` makes the tick mandatory for submission.

```jsx
<Checkbox checked={notify} onChange={setNotify} label="Notify on approval" />
<Checkbox checked={terms} onChange={setTerms} required name="terms" value="accepted" label="I accept the terms" />
<Checkbox checked disabled label="Locked by policy" />
```

**Do / Don't**
- Read the boolean the handler hands you (`onChange={next => …}`); there is no event to reach into, so `e.target.checked` no longer works.
- Use `name` and `value` together when the checkbox is submitted by a real form — `value` is the string sent under `name` while the box is ticked, and it is not the checked state.
- To toggle a setting that takes effect immediately, prefer `Switch`; a Checkbox states a choice a form will submit.
- Don't pass `style` or stray DOM attributes. Checkbox declares `checked`, `label`, `disabled`, `required`, `name` and `value`, and renders nothing else — to place or size it, style the container you put it in.
