Text field with validation (H5). Focus = gold ring, error = crimson with icon, valid = green with check. Requires the Phosphor sheets loaded for the state icons.

```jsx
<Input label="Repository" required prefix="git@" placeholder="org/project" />
<Input label="Email" validateOn="change"
  validate={(v) => /.+@.+\..+/.test(v) ? null : 'Invalid email format'} />
<Input label="Slug" valid defaultValue="customer-portal" hint="Available" />
```

Rules: validates on `blur` by default; use `validateOn="change"` only for live feedback (passwords, availability). Mark required fields with `required`.

### Dates and times

Use the native types. Arena deliberately ships **no `DatePicker` and no `TimePicker`** — the native control is the sanctioned approach: it is keyboard accessible, localized, and it is what a phone user already knows how to drive. Arena's job is to make it look like Arena, which it does, in both themes.

```jsx
<Input label="Deploy date" type="date" required />
<Input label="Window start" type="time" hint="Local time" />
<Input label="Cutover" type="datetime-local" error="Pick a date in the future" />
```

**Do**
- Use `type="date"` / `"time"` / `"datetime-local"`. Label, focus ring, error and valid states all work on them.
- Set `min` / `max` (they pass through) so the browser does the range validation for free.

**Don't**
- Don't build a custom calendar popover to replace it. That is a deliberate non-goal: a custom picker is a large accessibility surface to re-earn, and the native one already has it.
- Don't fake a date field with `type="text"` and a mask. It loses the picker, the mobile keyboard and the locale.
