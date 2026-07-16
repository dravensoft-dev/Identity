Switch for binary settings with immediate effect.

```jsx
<Switch checked={dark} onChange={e => setDark(e.target.checked)} label="Dark theme" />
```

For **high-impact** toggles (H5) use `confirm` + `onRequestChange`: the change is confirmed before it's applied.

```jsx
const [armed, setArmed] = useState(false);
const [pending, setPending] = useState(null); // proposed value

<Switch label="Automatic deployment to production" checked={armed} confirm
  onRequestChange={setPending} onChange={e => setArmed(e.target.checked)} />

<ConfirmDialog open={pending !== null} title="Enable automatic deployment"
  confirmLabel="Enable" onCancel={() => setPending(null)}
  onConfirm={() => { setArmed(pending); setPending(null); }}>
  Every approved commit will be deployed to production without manual review.
</ConfirmDialog>
```
