Text field with validation (H5). Focus = gold ring, error = crimson with icon, valid = green with check. Requires the Phosphor sheets loaded for the state icons.

```jsx
<Input label="Repository" required prefix="git@" placeholder="org/project" />
<Input label="Email" validateOn="change"
  validate={(v) => /.+@.+\..+/.test(v) ? null : 'Invalid email format'} />
<Input label="Slug" valid defaultValue="customer-portal" hint="Available" />
```

Rules: validates on `blur` by default; use `validateOn="change"` only for live feedback (passwords, availability). Mark required fields with `required`.
