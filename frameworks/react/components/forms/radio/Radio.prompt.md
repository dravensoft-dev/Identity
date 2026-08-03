One option inside a `RadioGroup`. Selected shows a crimson dot inside the ring. `value` is required and matched against the group's; `label` names the option and `hint` adds a line of help under it.

```tsx
<RadioGroup ariaLabel="Deployment target" value={env} onChange={setEnv}>
  <Radio value="prod" label="Production" hint="Real users, requires approval" />
  <Radio value="staging" label="Staging" />
  <Radio value="qa" label="QA" disabled />
</RadioGroup>
```

<!-- @api GENERATED from contracts/api/components/Radio.json. Edit the contract, not this table. -->

**Members**, in contract order and under this layer's own names. `*` marks a required one.

| Member | Form | Type | Default | What it is |
|---|---|---|---|---|
| `value*` | primitive | `string` |  | This option's value, matched against the group's. |
| `label` | primitive | `string` |  | The option's label. |
| `hint` | primitive | `string` |  | A line of help under the label. |
| `disabled` | primitive | `boolean` | `false` | Blocks selection and dims the option. |

<!-- @api end -->

**Do / Don't**
- Always render a Radio inside a `RadioGroup`, because the group injects the shared name and the selected state, so a standalone Radio is never selected and never groups.
- To toggle a single thing on/off, use `Switch` or `Checkbox`, not a standalone Radio.
- Don't pass `style` or stray DOM attributes. Radio declares `value`, `label`, `hint` and `disabled`, and renders nothing else. To lay options out differently, style the container you put the group in.
