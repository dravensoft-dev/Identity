A compact inline filter over mutually exclusive options: a scope, a range, a density. An enclosed track with a neutral raised thumb on the selected option. It is a real radio group under the hood, so the keyboard works the way a radio group works: one tab stop, arrows move and select.

```jsx
<SegmentedControl ariaLabel="Time range"
  options={[{ value: '24h', label: '24h' }, { value: '7d', label: '7d' }, { value: '30d', label: '30d' }]}
  value={range} onChange={setRange} />
```

```jsx
<SegmentedControl ariaLabel="Deployment status" size="sm"
  options={[{ value: 'all', label: 'All' }, { value: 'live', label: 'Live' }, { value: 'failed', label: 'Failed' }]}
  value={status} onChange={setStatus} />
```

**Not Tabs.** Tabs move between views and mark the active one with the crimson underline; this filters *within* the current view and carries no crimson, because a view spends its primary accent once. Pairing them is the normal case: Tabs on top, the control beneath, filtering what the tab opened.

**Do / Don't**
- Do keep it to two to four one-word labels. It is sized to shrink to its content and sit inline next to a heading or a table toolbar.
- Do name what is being filtered in `ariaLabel` ("Time range"), not the widget ("Filter").
- Don't use it to switch views or routes: that is `Tabs`. If picking an option repaints the whole page, you wanted Tabs.
- Don't reach for it as a form field. It is a filter; for a mutually exclusive answer inside a form, with labels that need room to breathe, use `RadioGroup`.
- Don't grow it past four options or give it sentence-long labels, because the track stops being compact and the choice belongs in a `Select`.
- Don't add an accent to the selected segment to make it "pop". The raised thumb is the signal; crimson here competes with the view's primary action.
- Don't pass bare strings as options. An option is an object with a `value` and a `label`, so the key `onChange` carries can stay stable while the label is translated.
- Don't reach for `style` or a stray global attribute. It takes neither; wrap it in a `<div>` that owns the layout.
