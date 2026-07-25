Section tabs. The active one has a crimson underline.

```jsx
<Tabs tabs={[{ value: 'overview', label: 'Overview' }, { value: 'deployments', label: 'Deployments' }, { value: 'activity', label: 'Activity' }]}
  onChange={setView} />
```

**Do / Don't**
- Do give every tab a `value` and a `label`. The bare-string form is gone — a tab is an object, so the key `onChange` carries can stay stable while the label is translated.
- Don't reach for `style` to space the strip. It takes no `style`; wrap it in a `<div>` that owns the margin.
