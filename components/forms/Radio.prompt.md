Single selection among options that are all visible at once. `RadioGroup` holds the value; each `Radio` declares its `value`.

```jsx
<RadioGroup value={env} onChange={setEnv}>
  <Radio value="prod" label="Production" hint="Real users — requires approval" />
  <Radio value="staging" label="Staging" />
  <Radio value="qa" label="QA" />
</RadioGroup>
```

**Do / Don't**
- Use Radio when it helps to see all the options (2–5) and they're mutually exclusive.
- For more than ~6 options or limited space, use `Select`.
- To toggle a single thing on/off, use `Switch` or `Checkbox`, not a standalone Radio.
