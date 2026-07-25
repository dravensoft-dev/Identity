Single selection among options that are all visible at once. `RadioGroup` holds the `value` and distributes each child's selected state; each `Radio` declares its own `value`.

```jsx
<RadioGroup value={env} onChange={setEnv}>
  <Radio value="prod" label="Production" hint="Real users — requires approval" />
  <Radio value="staging" label="Staging" />
  <Radio value="qa" label="QA" />
</RadioGroup>
```

`onChange` carries the chosen option's **value**, never a DOM event. Pass `name` to share one name across the underlying native radios; one is generated when you omit it.

**Do / Don't**
- Use Radio when it helps to see all the options (2–5) and they're mutually exclusive.
- For more than ~6 options or limited space, use `Select`.
- Don't pass `style` or stray DOM attributes. RadioGroup declares its `content` slot plus `value`, `name` and `onChange`, and renders nothing else — to space or constrain the group differently, wrap it in your own element rather than reaching through it.
