Single selection among options that are all visible at once. `RadioGroup` holds the `value` and distributes each child's selected state; each `Radio` declares its own `value`.

```tsx
<RadioGroup ariaLabel="Deployment target" value={env} onChange={setEnv}>
  <Radio value="prod" label="Production" hint="Real users, requires approval" />
  <Radio value="staging" label="Staging" />
  <Radio value="qa" label="QA" />
</RadioGroup>
```

`ariaLabel` names the group and is **required**, throwing when absent. It says what is being
chosen, not that a choice is happening: each `Radio`'s own label already says what that option
is, and nothing else in the group says what the SET is for. `name` is not a substitute: it is the shared form name
for the underlying native radios and never reaches a screen reader. One is generated when you
omit it.

`onChange` carries the chosen option's **value**, never a DOM event.

**Do / Don't**
- Use Radio when it helps to see all the options (2–5) and they're mutually exclusive.
- For more than ~6 options or limited space, use `Select`.
- Don't pass `style` or stray DOM attributes. RadioGroup declares its `content` slot plus `ariaLabel`, `value`, `name` and `onChange`, and renders nothing else. To space or constrain the group differently, wrap it in your own element rather than reaching through it.
